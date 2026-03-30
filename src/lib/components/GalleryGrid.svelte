<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Photo } from "$lib/types";

  interface Props {
    photos?: Photo[];
  }

  let { photos = [] }: Props = $props();

  const dispatch = createEventDispatcher<{
    select: Photo;
    delete: string;
  }>();

  let selectedId = $state<string | null>(null);

  function handleSelect(photo: Photo) {
    selectedId = photo.id;
    dispatch("select", photo);
  }

  function handleDelete(id: string, e: Event) {
    e.stopPropagation();
    dispatch("delete", id);
    if (selectedId === id) {
      selectedId = null;
    }
  }

  const selectedPhoto = $derived(photos.find((p) => p.id === selectedId));
</script>

<div class="gallery-grid">
  {#if photos.length === 0}
    <div class="text-center py-8 text-text-muted font-mono text-sm">
      <p>No photos in this session</p>
    </div>
  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {#each photos as photo (photo.id)}
        <div
          class="aspect-video rounded-lg overflow-hidden border-2 transition-all relative group cursor-pointer {selectedId === photo.id ? 'border-accent-primary shadow-[0_0_12px_#f5c518]' : 'border-border hover:border-text-muted'}"
          onclick={() => handleSelect(photo)}
          onkeydown={(e) => e.key === "Enter" && handleSelect(photo)}
          role="button"
          tabindex="0"
        >
          <img
            src={photo.dataUrl}
            alt={`Photo taken at ${new Date(photo.timestamp).toLocaleTimeString()}`}
            class="w-full h-full object-cover"
          />
          <div
            class="absolute inset-0 bg-bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <button
              class="p-2 rounded-full bg-accent-secondary text-text-primary"
              onclick={(e) => handleDelete(photo.id, e)}
              aria-label="Delete photo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if selectedPhoto}
  <div
    class="fixed inset-0 bg-bg-primary/90 z-50 flex items-center justify-center p-8"
    onclick={() => (selectedId = null)}
    onkeydown={(e) => e.key === "Escape" && (selectedId = null)}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="max-w-4xl max-h-full">
      <img
        src={selectedPhoto.dataUrl}
        alt="Selected photo"
        class="max-w-full max-h-[80vh] rounded-lg border border-border"
      />
      <div class="mt-4 text-center text-text-muted font-mono text-sm">
        {new Date(selectedPhoto.timestamp).toLocaleString()}
        <span class="mx-2">|</span>
        Filter: {selectedPhoto.filter}
      </div>
    </div>
  </div>
{/if}
