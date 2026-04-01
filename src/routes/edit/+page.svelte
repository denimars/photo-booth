<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import PhotoStrip from "$lib/components/PhotoStrip.svelte";
  import BackgroundSelector from "$lib/components/BackgroundSelector.svelte";
  import StickerPanel from "$lib/components/StickerPanel.svelte";
  import { session } from "$lib/stores/session";
  import { settings } from "$lib/stores/settings";
  import { placedStickers } from "$lib/stores/stickers";
  import { savePhoto, printPhoto } from "$lib/utils/export";
  import { createPhotoStrip } from "$lib/utils/canvas";
  import { getStickerById } from "$lib/utils/stickers";
  import type { BackgroundId, StickerId, PlacedSticker } from "$lib/types";

  let stripDataUrl = $state<string | null>(null);
  let isSaving = $state(false);
  let isPrinting = $state(false);
  let previewRef = $state<HTMLDivElement | null>(null);
  let stripImageRef = $state<HTMLImageElement | null>(null);
  let draggingSticker = $state<string | null>(null);
  let selectedSticker = $state<string | null>(null);
  let resizingSticker = $state<string | null>(null);
  let rotatingSticker = $state<string | null>(null);
  let resizeStartData = $state<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  let rotateStartData = $state<{ startAngle: number; startRotation: number; centerX: number; centerY: number } | null>(null);

  onMount(() => {
    settings.load();
    placedStickers.clearStickers();
    // Redirect to capture page if no photos
    if ($session.stripPhotos.length === 0) {
      goto("/");
    }
  });

  function handleBackgroundChange(e: CustomEvent<BackgroundId>) {
    settings.setBackground(e.detail);
  }

  function handleStickerSelect(e: CustomEvent<StickerId>) {
    if (!stripImageRef) return;
    // Add sticker to center of the strip image
    const x = stripImageRef.clientWidth / 2 - 40;
    const y = stripImageRef.clientHeight / 2 - 40;
    const id = placedStickers.addSticker(e.detail, x, y);
    selectedSticker = id;
  }

  function handleStickerMouseDown(e: MouseEvent, sticker: PlacedSticker) {
    e.preventDefault();
    e.stopPropagation();
    draggingSticker = sticker.id;
    selectedSticker = sticker.id;
  }

  function handleMouseMove(e: MouseEvent) {
    if (!stripImageRef) return;
    const rect = stripImageRef.getBoundingClientRect();

    // Handle sticker dragging
    if (draggingSticker) {
      const sticker = $placedStickers.find((s) => s.id === draggingSticker);
      if (sticker) {
        const x = e.clientX - rect.left - sticker.width / 2;
        const y = e.clientY - rect.top - sticker.height / 2;
        placedStickers.updateSticker(draggingSticker, { x, y });
      }
    }

    // Handle resize
    if (resizingSticker && resizeStartData) {
      const dx = e.clientX - resizeStartData.startX;
      const dy = e.clientY - resizeStartData.startY;
      const delta = Math.max(dx, dy);
      const newSize = Math.max(30, Math.min(300, resizeStartData.startWidth + delta));
      placedStickers.updateSticker(resizingSticker, { width: newSize, height: newSize });
    }

    // Handle rotation
    if (rotatingSticker && rotateStartData) {
      const dx = e.clientX - rotateStartData.centerX;
      const dy = e.clientY - rotateStartData.centerY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      const newRotation = angle - rotateStartData.startAngle + rotateStartData.startRotation;
      placedStickers.updateSticker(rotatingSticker, { rotation: newRotation });
    }
  }

  function handleMouseUp() {
    draggingSticker = null;
    resizingSticker = null;
    rotatingSticker = null;
    resizeStartData = null;
    rotateStartData = null;
  }

  function handleResizeStart(e: MouseEvent, sticker: PlacedSticker) {
    e.preventDefault();
    e.stopPropagation();
    resizingSticker = sticker.id;
    selectedSticker = sticker.id;
    resizeStartData = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: sticker.width,
      startHeight: sticker.height,
    };
  }

  function handleRotateStart(e: MouseEvent, sticker: PlacedSticker) {
    e.preventDefault();
    e.stopPropagation();
    if (!stripImageRef) return;

    const rect = stripImageRef.getBoundingClientRect();
    const centerX = rect.left + sticker.x + sticker.width / 2;
    const centerY = rect.top + sticker.y + sticker.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const startAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

    rotatingSticker = sticker.id;
    selectedSticker = sticker.id;
    rotateStartData = {
      startAngle,
      startRotation: sticker.rotation,
      centerX,
      centerY,
    };
  }

  function handleDeleteSticker() {
    if (selectedSticker) {
      placedStickers.removeSticker(selectedSticker);
      selectedSticker = null;
    }
  }

  function handleResizeSticker(delta: number) {
    if (!selectedSticker) return;
    const sticker = $placedStickers.find((s) => s.id === selectedSticker);
    if (sticker) {
      const newSize = Math.max(30, Math.min(200, sticker.width + delta));
      placedStickers.updateSticker(selectedSticker, { width: newSize, height: newSize });
    }
  }

  function handleRotateSticker(delta: number) {
    if (!selectedSticker) return;
    const sticker = $placedStickers.find((s) => s.id === selectedSticker);
    if (sticker) {
      placedStickers.updateSticker(selectedSticker, { rotation: sticker.rotation + delta });
    }
  }

  function handleStripReady(dataUrl: string) {
    stripDataUrl = dataUrl;
  }

  async function handleSave() {
    if (!stripDataUrl || !stripImageRef) return;
    isSaving = true;
    try {
      // Use image dimensions directly (no border now)
      const containerWidth = stripImageRef.clientWidth;
      const containerHeight = stripImageRef.clientHeight;

      const finalDataUrl = await createPhotoStrip({
        photos: $session.stripPhotos.slice(0, $settings.stripCount),
        backgroundId: $settings.selectedBackground,
        stickers: $placedStickers,
        containerWidth,
        containerHeight,
      });

      await savePhoto({ dataUrl: finalDataUrl });
      placedStickers.clearStickers();
      session.endStripMode();
      goto("/");
    } catch (err) {
      console.error("Failed to save strip:", err);
    } finally {
      isSaving = false;
    }
  }

  async function handlePrint() {
    if (!stripDataUrl || !stripImageRef) return;
    isPrinting = true;
    try {
      // Use image dimensions directly (no border now)
      const containerWidth = stripImageRef.clientWidth;
      const containerHeight = stripImageRef.clientHeight;

      const finalDataUrl = await createPhotoStrip({
        photos: $session.stripPhotos.slice(0, $settings.stripCount),
        backgroundId: $settings.selectedBackground,
        stickers: $placedStickers,
        containerWidth,
        containerHeight,
      });

      await printPhoto(finalDataUrl);
    } catch (err) {
      console.error("Failed to print:", err);
    } finally {
      isPrinting = false;
    }
  }

  function handleRetake() {
    placedStickers.clearStickers();
    goto("/");
  }

  function handleDiscard() {
    placedStickers.clearStickers();
    session.endStripMode();
    goto("/");
  }

  async function handleSaveStrip(e: CustomEvent<string>) {
    const dataUrl = e.detail;
    if (!dataUrl) return;
    isSaving = true;
    try {
      await savePhoto({ dataUrl });
      placedStickers.clearStickers();
      session.endStripMode();
      goto("/");
    } catch (err) {
      console.error("Failed to save strip:", err);
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:window
  onmousemove={handleMouseMove}
  onmouseup={handleMouseUp}
  onclick={(e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-sticker]') && !target.closest('[data-sticker-control]')) {
      selectedSticker = null;
    }
  }}
/>

<div class="h-screen flex flex-col bg-bg-primary">
  <!-- Header -->
  <header class="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
    <h1 class="text-2xl font-display text-accent-primary">Edit & Print</h1>
    <button
      class="text-text-muted hover:text-text-primary font-mono text-sm transition-colors"
      onclick={handleRetake}
    >
      &larr; Retake Photos
    </button>
  </header>

  <!-- Main Content - Scrollable -->
  <main class="flex-1 flex overflow-hidden">
    <!-- Left Sidebar - Background & Stickers -->
    <aside class="w-72 border-r border-border overflow-y-auto">
      <div class="p-4 space-y-6">
        <BackgroundSelector
          selected={$settings.selectedBackground}
          on:change={handleBackgroundChange}
        />

        <StickerPanel on:select={handleStickerSelect} />

        <!-- Sticker Controls -->
        {#if selectedSticker}
          <div data-sticker-control>
            <h3 class="text-text-muted text-xs uppercase tracking-wider mb-3 font-mono">
              Sticker Controls
            </h3>
            <div class="space-y-2">
              <div class="flex gap-2">
                <button
                  class="flex-1 px-3 py-2 rounded border border-border text-text-muted hover:border-accent-primary hover:text-accent-primary font-mono text-sm transition-colors"
                  onclick={() => handleResizeSticker(-10)}
                >
                  - Size
                </button>
                <button
                  class="flex-1 px-3 py-2 rounded border border-border text-text-muted hover:border-accent-primary hover:text-accent-primary font-mono text-sm transition-colors"
                  onclick={() => handleResizeSticker(10)}
                >
                  + Size
                </button>
              </div>
              <div class="flex gap-2">
                <button
                  class="flex-1 px-3 py-2 rounded border border-border text-text-muted hover:border-accent-primary hover:text-accent-primary font-mono text-sm transition-colors"
                  onclick={() => handleRotateSticker(-15)}
                >
                  Rotate L
                </button>
                <button
                  class="flex-1 px-3 py-2 rounded border border-border text-text-muted hover:border-accent-primary hover:text-accent-primary font-mono text-sm transition-colors"
                  onclick={() => handleRotateSticker(15)}
                >
                  Rotate R
                </button>
              </div>
              <button
                class="w-full px-3 py-2 rounded border border-red-300 text-red-500 hover:bg-red-50 font-mono text-sm transition-colors"
                onclick={handleDeleteSticker}
              >
                Delete Sticker
              </button>
            </div>
          </div>
        {/if}
      </div>
    </aside>

    <!-- Center - Photo Strip Preview with Stickers -->
    <div class="flex-1 overflow-y-auto p-8">
      <div class="flex flex-col items-center min-h-full">
        <div class="max-w-md w-full">
          <PhotoStrip
            photos={$session.stripPhotos}
            backgroundId={$settings.selectedBackground}
            requiredCount={$settings.stripCount}
            stickers={$placedStickers}
            onStripReady={(dataUrl) => stripDataUrl = dataUrl}
            onImageRef={(el) => stripImageRef = el}
            onPreviewRef={(el) => previewRef = el}
            on:save={handleSaveStrip}
            on:discard={handleDiscard}
          >
            {#snippet stickerOverlay()}
              <!-- Sticker Overlay (positioned relative to strip-preview) -->
              {#each $placedStickers as sticker, index (sticker.id)}
                {@const stickerData = getStickerById(sticker.stickerId)}
                {@const isSelected = selectedSticker === sticker.id}
                {#if stickerData}
                  <div
                    class="absolute select-none"
                    style="left: {sticker.x}px; top: {sticker.y}px; width: {sticker.width}px; height: {sticker.height}px; transform: rotate({sticker.rotation}deg); z-index: {isSelected ? 100 : 10 + index};"
                    data-sticker
                  >
                    <!-- Sticker image -->
                    <div
                      class="w-full h-full cursor-move rounded {isSelected ? 'ring-2 ring-accent-primary' : ''}"
                      onmousedown={(e) => handleStickerMouseDown(e, sticker)}
                      onclick={(e) => { e.stopPropagation(); selectedSticker = sticker.id; }}
                      role="button"
                      tabindex="0"
                    >
                      <img
                        src={stickerData.src}
                        alt={stickerData.name}
                        class="w-full h-full object-contain pointer-events-none"
                        draggable="false"
                      />
                    </div>

                    <!-- Controls (only show when selected) -->
                    {#if isSelected}
                      <!-- Rotation handle (top center) -->
                      <button
                        type="button"
                        class="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab bg-transparent border-0 p-0"
                        onmousedown={(e) => handleRotateStart(e, sticker)}
                        aria-label="Rotate sticker"
                      >
                        <div class="w-0.5 h-4 bg-accent-primary"></div>
                        <div class="w-4 h-4 rounded-full bg-accent-primary border-2 border-white shadow-md flex items-center justify-center">
                          <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                      </button>

                      <!-- Resize handle (bottom-right corner) -->
                      <button
                        type="button"
                        class="absolute -bottom-2 -right-2 w-5 h-5 bg-accent-primary border-2 border-white rounded-sm shadow-md cursor-se-resize p-0"
                        onmousedown={(e) => handleResizeStart(e, sticker)}
                        aria-label="Resize sticker"
                      ></button>

                      <!-- Delete button (top-right corner) -->
                      <button
                        class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 border-2 border-white rounded-full shadow-md flex items-center justify-center hover:bg-red-600 transition-colors"
                        onclick={(e) => { e.stopPropagation(); handleDeleteSticker(); }}
                        aria-label="Delete sticker"
                      >
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    {/if}
                  </div>
                {/if}
              {/each}
            {/snippet}
          </PhotoStrip>
        </div>
      </div>
    </div>

    <!-- Right Sidebar - Actions -->
    <aside class="w-72 border-l border-border overflow-y-auto">
      <div class="p-4 space-y-6">
        <div>
          <h3 class="text-text-muted text-xs uppercase tracking-wider mb-3 font-mono">
            Actions
          </h3>

          <div class="space-y-3">
            <button
              class="w-full px-4 py-3 rounded-lg bg-accent-primary text-bg-primary font-mono font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onclick={handleSave}
              disabled={isSaving || !stripDataUrl}
            >
              {isSaving ? "Saving..." : "Save to Disk"}
            </button>

            <button
              class="w-full px-4 py-3 rounded-lg bg-accent-secondary text-bg-primary font-mono font-medium hover:bg-accent-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onclick={handlePrint}
              disabled={isPrinting || !stripDataUrl}
            >
              {isPrinting ? "Printing..." : "Print"}
            </button>

            <button
              class="w-full px-4 py-3 rounded-lg border border-border text-text-muted font-mono hover:border-accent-secondary hover:text-accent-secondary transition-colors"
              onclick={handleRetake}
            >
              Retake Photos
            </button>
          </div>
        </div>

        <!-- Photo Thumbnails -->
        <div>
          <h3 class="text-text-muted text-xs uppercase tracking-wider mb-3 font-mono">
            Photos ({$session.stripPhotos.length})
          </h3>
          <div class="grid grid-cols-2 gap-2">
            {#each $session.stripPhotos as photo, i}
              <div class="aspect-video rounded overflow-hidden border border-border">
                <img src={photo} alt={`Photo ${i + 1}`} class="w-full h-full object-cover" />
              </div>
            {/each}
          </div>
        </div>

        <!-- Placed Stickers List -->
        {#if $placedStickers.length > 0}
          <div>
            <h3 class="text-text-muted text-xs uppercase tracking-wider mb-3 font-mono">
              Placed Stickers ({$placedStickers.length})
            </h3>
            <div class="space-y-2">
              {#each $placedStickers as sticker}
                {@const stickerData = getStickerById(sticker.stickerId)}
                {#if stickerData}
                  <button
                    class="w-full flex items-center gap-2 p-2 rounded border transition-colors {selectedSticker === sticker.id ? 'border-accent-primary bg-accent-primary/10' : 'border-border hover:border-accent-primary'}"
                    onclick={() => selectedSticker = sticker.id}
                  >
                    <img src={stickerData.src} alt={stickerData.name} class="w-6 h-6 object-contain" />
                    <span class="text-sm font-mono text-text-primary">{stickerData.name}</span>
                  </button>
                {/if}
              {/each}
              <button
                class="w-full px-3 py-2 rounded border border-border text-text-muted hover:border-red-300 hover:text-red-500 font-mono text-xs transition-colors"
                onclick={() => placedStickers.clearStickers()}
              >
                Clear All Stickers
              </button>
            </div>
          </div>
        {/if}
      </div>
    </aside>
  </main>
</div>
