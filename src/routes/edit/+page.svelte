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
  let imageContainerRef = $state<HTMLDivElement | null>(null);
  let draggingSticker = $state<string | null>(null);
  let selectedSticker = $state<string | null>(null);

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
    if (!imageContainerRef) return;
    // Add sticker to center of the image
    const rect = imageContainerRef.getBoundingClientRect();
    const x = rect.width / 2 - 40;
    const y = rect.height / 2 - 40;
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
    if (!draggingSticker || !imageContainerRef) return;
    const rect = imageContainerRef.getBoundingClientRect();
    const x = e.clientX - rect.left - 40;
    const y = e.clientY - rect.top - 40;
    placedStickers.updateSticker(draggingSticker, { x, y });
  }

  function handleMouseUp() {
    draggingSticker = null;
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
    if (!stripDataUrl || !imageContainerRef) return;
    isSaving = true;
    try {
      // Generate final strip with stickers
      const containerWidth = imageContainerRef.offsetWidth;
      const containerHeight = imageContainerRef.offsetHeight;

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
    if (!stripDataUrl || !imageContainerRef) return;
    isPrinting = true;
    try {
      // Generate final strip with stickers for printing
      const containerWidth = imageContainerRef.offsetWidth;
      const containerHeight = imageContainerRef.offsetHeight;

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
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

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
          <div>
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
        <div
          class="max-w-md w-full relative"
          bind:this={stripContainerRef}
        >
          <PhotoStrip
            photos={$session.stripPhotos}
            backgroundId={$settings.selectedBackground}
            requiredCount={$settings.stripCount}
            stickers={$placedStickers}
            onStripReady={(dataUrl) => stripDataUrl = dataUrl}
            on:save={handleSaveStrip}
            on:discard={handleDiscard}
          />

          <!-- Sticker Overlay (for dragging) -->
          {#each $placedStickers as sticker (sticker.id)}
            {@const stickerData = getStickerById(sticker.stickerId)}
            {#if stickerData}
              <div
                class="absolute cursor-move select-none {selectedSticker === sticker.id ? 'ring-2 ring-accent-primary ring-offset-2' : ''}"
                style="left: {sticker.x}px; top: {sticker.y}px; width: {sticker.width}px; height: {sticker.height}px; transform: rotate({sticker.rotation}deg);"
                onmousedown={(e) => handleStickerMouseDown(e, sticker)}
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
            {/if}
          {/each}
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
              onclick={() => {
                if (stripDataUrl) {
                  handleSaveStrip(new CustomEvent('save', { detail: stripDataUrl }));
                }
              }}
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
