<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { filterList, getFilterCss } from "$lib/utils/filters";
  import type { FilterName } from "$lib/types";

  interface Props {
    selected?: FilterName;
    videoEl?: HTMLVideoElement | null;
  }

  let { selected = "none", videoEl = null }: Props = $props();

  const dispatch = createEventDispatcher<{
    change: FilterName;
  }>();

  function selectFilter(name: FilterName) {
    dispatch("change", name);
  }
</script>

<div class="filter-panel">
  <h3 class="text-text-muted text-xs uppercase tracking-wider mb-3 font-mono">Filters</h3>
  <div class="grid grid-cols-2 gap-2">
    {#each filterList as filter}
      <button
        class="p-2 rounded-lg border bg-bg-surface text-text-primary transition-all duration-200 {selected === filter.name ? 'border-accent-primary shadow-[0_0_12px_#f5c518]' : 'border-border hover:border-text-muted'}"
        onclick={() => selectFilter(filter.name)}
      >
        <div
          class="w-full aspect-video rounded bg-bg-primary mb-1 overflow-hidden"
        >
          <div
            class="w-full h-full bg-gradient-to-br from-text-muted to-bg-surface"
            style:filter={getFilterCss(filter.name)}
          ></div>
        </div>
        <span class="text-xs font-mono">{filter.label}</span>
      </button>
    {/each}
  </div>
</div>
