<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { createPhotoStrip } from "$lib/utils/canvas";
  import type { BackgroundId, PlacedSticker } from "$lib/types";

  interface Props {
    photos?: string[];
    backgroundId: BackgroundId;
    requiredCount?: number;
    stickers?: PlacedSticker[];
    onStripReady?: (dataUrl: string) => void;
  }

  let { photos = [], backgroundId, requiredCount = 4, stickers = [], onStripReady }: Props = $props();

  const dispatch = createEventDispatcher<{
    save: string;
    discard: void;
  }>();

  let stripDataUrl = $state<string | null>(null);
  let isGenerating = $state(false);
  let containerRef = $state<HTMLDivElement | null>(null);

  // Only regenerate when photos or background changes (NOT stickers)
  $effect(() => {
    const _bg = backgroundId;
    const _photos = photos;
    if (photos.length >= requiredCount) {
      generateStrip();
    } else {
      stripDataUrl = null;
    }
  });

  async function generateStrip() {
    if (photos.length < requiredCount) return;
    isGenerating = true;

    try {
      // Generate strip WITHOUT stickers for preview
      stripDataUrl = await createPhotoStrip({
        photos: photos.slice(0, requiredCount),
        backgroundId,
      });
      if (stripDataUrl && onStripReady) {
        onStripReady(stripDataUrl);
      }
    } catch (err) {
      console.error("Failed to generate strip:", err);
    } finally {
      isGenerating = false;
    }
  }

  // Generate final strip WITH stickers when saving
  async function handleSave() {
    if (!stripDataUrl) return;
    isGenerating = true;

    try {
      const containerWidth = containerRef?.offsetWidth || 400;
      const containerHeight = containerRef?.offsetHeight || 600;

      // Generate final strip with stickers
      const finalDataUrl = await createPhotoStrip({
        photos: photos.slice(0, requiredCount),
        backgroundId,
        stickers,
        containerWidth,
        containerHeight,
      });
      dispatch("save", finalDataUrl);
    } catch (err) {
      console.error("Failed to generate final strip:", err);
    } finally {
      isGenerating = false;
    }
  }

  function handleDiscard() {
    dispatch("discard");
  }
</script>

<div class="photo-strip bg-bg-surface rounded-lg p-4 border border-border" bind:this={containerRef}>
  <h3 class="text-text-muted text-xs uppercase tracking-wider mb-3 font-mono">
    Photo Strip ({photos.length})
  </h3>

  {#if isGenerating}
    <div class="flex items-center justify-center py-8">
      <span class="text-text-muted font-mono text-sm">Generating strip...</span>
    </div>
  {:else if stripDataUrl}
    <div class="strip-preview mb-4">
      <img
        src={stripDataUrl}
        alt="Photo strip preview"
        class="w-full rounded border border-border"
      />
    </div>
    <div class="flex gap-2">
      <button
        class="flex-1 px-3 py-2 rounded bg-accent-primary text-bg-primary font-mono text-sm font-medium hover:bg-accent-primary/90 transition-colors"
        onclick={handleSave}
      >
        Save Strip
      </button>
      <button
        class="px-3 py-2 rounded border border-border text-text-muted font-mono text-sm hover:border-accent-secondary hover:text-accent-secondary transition-colors"
        onclick={handleDiscard}
      >
        Discard
      </button>
    </div>
  {:else if photos.length > 0}
    <div class="grid grid-cols-2 gap-2">
      {#each photos as photo, i}
        <div class="photo-item aspect-video rounded overflow-hidden border border-border">
          <img src={photo} alt={`Photo ${i + 1}`} class="w-full h-full object-cover" />
        </div>
      {/each}
      {#each Array(requiredCount - photos.length) as _, i}
        <div class="photo-item aspect-video rounded overflow-hidden border border-border border-dashed bg-bg-primary/50 flex items-center justify-center">
          <span class="text-text-muted text-xs font-mono">{photos.length + i + 1}</span>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center py-8 text-text-muted font-mono text-sm">
      <p>No photos yet</p>
      <p class="text-xs mt-1">Take photos to create a strip</p>
    </div>
  {/if}
</div>
