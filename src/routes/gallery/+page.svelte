<script lang="ts">
  import GalleryGrid from "$lib/components/GalleryGrid.svelte";
  import { session } from "$lib/stores/session";
  import { savePhoto } from "$lib/utils/export";
  import type { Photo } from "$lib/types";

  let selectedPhoto: Photo | null = $state(null);

  function handleSelect(e: CustomEvent<Photo>) {
    selectedPhoto = e.detail;
  }

  function handleDelete(e: CustomEvent<string>) {
    session.removePhoto(e.detail);
    if (selectedPhoto?.id === e.detail) {
      selectedPhoto = null;
    }
  }

  async function handleSave(photo: Photo) {
    try {
      await savePhoto({ dataUrl: photo.dataUrl });
    } catch (err) {
      console.error("Failed to save photo:", err);
    }
  }

  function handleClearSession() {
    if (confirm("Are you sure you want to clear all photos from this session?")) {
      session.clearSession();
    }
  }
</script>

<div class="gallery-page min-h-screen bg-bg-primary">
  <!-- Header -->
  <header class="flex items-center justify-between px-6 py-4 border-b border-border">
    <div class="flex items-center gap-4">
      <a
        href="/"
        class="text-text-muted hover:text-text-primary font-mono text-sm transition-colors"
      >
        &larr; Back to Booth
      </a>
      <h1 class="text-2xl font-display text-accent-primary">Gallery</h1>
    </div>
    <div class="flex items-center gap-4">
      <span class="text-text-muted font-mono text-sm">
        {$session.photos.length} photo{$session.photos.length !== 1 ? "s" : ""}
      </span>
      {#if $session.photos.length > 0}
        <button
          class="px-3 py-1 rounded border border-accent-secondary text-accent-secondary font-mono text-sm hover:bg-accent-secondary hover:text-text-primary transition-colors"
          onclick={handleClearSession}
        >
          Clear All
        </button>
      {/if}
    </div>
  </header>

  <!-- Gallery Content -->
  <main class="p-6">
    {#if $session.photos.length === 0}
      <div class="flex flex-col items-center justify-center py-20">
        <div class="text-6xl mb-4 opacity-20">📷</div>
        <p class="text-text-muted font-mono text-lg">No photos yet</p>
        <p class="text-text-muted font-mono text-sm mt-2">
          Go back to the booth and take some photos!
        </p>
        <a
          href="/"
          class="mt-6 px-6 py-2 rounded bg-accent-primary text-bg-primary font-mono font-medium hover:bg-accent-primary/90 transition-colors"
        >
          Open Booth
        </a>
      </div>
    {:else}
      <GalleryGrid
        photos={$session.photos}
        on:select={handleSelect}
        on:delete={handleDelete}
      />

      <!-- Bulk Actions -->
      <div class="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-bg-surface rounded-full border border-border shadow-xl">
        <span class="text-text-muted font-mono text-sm">
          {$session.photos.length} photos in session
        </span>
        <div class="w-px h-6 bg-border"></div>
        <button
          class="px-4 py-1 rounded-full bg-accent-primary text-bg-primary font-mono text-sm font-medium hover:bg-accent-primary/90 transition-colors"
          onclick={() => {
            $session.photos.forEach((photo) => handleSave(photo));
          }}
        >
          Save All
        </button>
      </div>
    {/if}
  </main>
</div>
