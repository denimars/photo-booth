<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import PhotoStrip from "$lib/components/PhotoStrip.svelte";
  import BackgroundSelector from "$lib/components/BackgroundSelector.svelte";
  import { session } from "$lib/stores/session";
  import { settings } from "$lib/stores/settings";
  import { savePhoto, printPhoto } from "$lib/utils/export";
  import type { BackgroundId } from "$lib/types";

  let stripDataUrl = $state<string | null>(null);
  let isSaving = $state(false);
  let isPrinting = $state(false);

  onMount(() => {
    settings.load();
    // Redirect to capture page if no photos
    if ($session.stripPhotos.length === 0) {
      goto("/");
    }
  });

  function handleBackgroundChange(e: CustomEvent<BackgroundId>) {
    settings.setBackground(e.detail);
  }

  async function handleSaveStrip(e: CustomEvent<string>) {
    stripDataUrl = e.detail;
    isSaving = true;
    try {
      await savePhoto({ dataUrl: e.detail });
      session.endStripMode();
      goto("/");
    } catch (err) {
      console.error("Failed to save strip:", err);
    } finally {
      isSaving = false;
    }
  }

  async function handlePrint() {
    if (!stripDataUrl) return;
    isPrinting = true;
    try {
      await printPhoto(stripDataUrl);
    } catch (err) {
      console.error("Failed to print:", err);
    } finally {
      isPrinting = false;
    }
  }

  function handleRetake() {
    session.endStripMode();
    goto("/");
  }

  function handleDiscard() {
    session.endStripMode();
    goto("/");
  }
</script>

<div class="h-screen flex flex-col bg-bg-primary">
  <!-- Header -->
  <header class="flex items-center justify-between px-6 py-4 border-b border-border">
    <h1 class="text-2xl font-display text-accent-primary">Edit & Print</h1>
    <button
      class="text-text-muted hover:text-text-primary font-mono text-sm transition-colors"
      onclick={handleRetake}
    >
      &larr; Retake Photos
    </button>
  </header>

  <!-- Main Content -->
  <main class="flex-1 flex overflow-hidden">
    <!-- Left Sidebar - Background Selection -->
    <aside class="w-72 p-4 border-r border-border overflow-y-auto">
      <BackgroundSelector
        selected={$settings.selectedBackground}
        on:change={handleBackgroundChange}
      />
    </aside>

    <!-- Center - Photo Strip Preview -->
    <div class="flex-1 flex flex-col items-center justify-center p-8">
      <div class="max-w-md w-full">
        <PhotoStrip
          photos={$session.stripPhotos}
          backgroundId={$settings.selectedBackground}
          requiredCount={$settings.stripCount}
          onStripReady={(dataUrl) => stripDataUrl = dataUrl}
          on:save={handleSaveStrip}
          on:discard={handleDiscard}
        />
      </div>
    </div>

    <!-- Right Sidebar - Actions -->
    <aside class="w-72 p-4 border-l border-border overflow-y-auto">
      <div class="space-y-6">
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
      </div>
    </aside>
  </main>
</div>
