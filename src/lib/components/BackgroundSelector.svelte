<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { backgroundList } from "$lib/utils/backgrounds";
  import type { BackgroundId } from "$lib/types";

  interface Props {
    selected: BackgroundId;
  }

  let { selected }: Props = $props();

  const dispatch = createEventDispatcher<{
    change: BackgroundId;
  }>();

  function handleSelect(id: BackgroundId) {
    dispatch("change", id);
  }
</script>

<div class="space-y-3">
  <h3 class="text-text-muted text-xs uppercase tracking-wider font-mono">
    Background
  </h3>

  <div class="grid grid-cols-1 gap-3">
    {#each backgroundList as bg}
      <button
        class="relative rounded-lg overflow-hidden border-2 transition-all {selected === bg.id
          ? 'border-accent-primary ring-2 ring-accent-primary/30'
          : 'border-border hover:border-text-muted'}"
        onclick={() => handleSelect(bg.id)}
      >
        <img
          src={bg.preview}
          alt={bg.name}
          class="w-full h-24 object-cover object-top bg-bg-surface"
        />
        <div
          class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2"
        >
          <span class="text-xs font-mono text-white">{bg.name}</span>
        </div>
        {#if selected === bg.id}
          <div
            class="absolute top-2 right-2 w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center"
          >
            <svg
              class="w-3 h-3 text-bg-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        {/if}
      </button>
    {/each}
  </div>
</div>
