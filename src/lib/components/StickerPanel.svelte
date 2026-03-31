<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { stickers } from "$lib/utils/stickers";
  import type { StickerId } from "$lib/types";

  const dispatch = createEventDispatcher<{ select: StickerId }>();

  function handleSelect(id: StickerId) {
    dispatch("select", id);
  }
</script>

<div>
  <h3 class="text-text-muted text-xs uppercase tracking-wider mb-3 font-mono">
    Stickers
  </h3>
  <p class="text-text-muted text-xs font-mono mb-3">
    Click to add sticker, then drag to position
  </p>
  <div class="grid grid-cols-4 gap-2">
    {#each stickers as sticker}
      <button
        class="aspect-square p-2 rounded-lg border border-border hover:border-accent-primary hover:bg-accent-primary/10 transition-colors flex items-center justify-center"
        onclick={() => handleSelect(sticker.id)}
        title={sticker.name}
      >
        <img src={sticker.src} alt={sticker.name} class="w-8 h-8 object-contain" />
      </button>
    {/each}
  </div>
</div>
