<script lang="ts">
  import { createEventDispatcher } from "svelte";

  interface Props {
    disabled?: boolean;
    isCapturing?: boolean;
    stripMode?: boolean;
  }

  let { disabled = false, isCapturing = false, stripMode = false }: Props = $props();

  const dispatch = createEventDispatcher<{
    capture: void;
    strip: void;
  }>();

  function handleCapture() {
    if (disabled || isCapturing) return;
    dispatch("capture");
  }

  function handleStrip() {
    if (disabled || isCapturing) return;
    dispatch("strip");
  }
</script>

<div class="flex items-center gap-4">
  <button
    class="w-20 h-20 rounded-full bg-gradient-to-br from-bg-surface to-border border-4 border-accent-primary flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-[0_0_20px_#f5c518] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed {isCapturing ? 'animate-pulse' : ''}"
    {disabled}
    onclick={handleCapture}
    aria-label="Take photo"
  >
    <span class="w-[60px] h-[60px] rounded-full bg-accent-secondary transition-all duration-200 hover:bg-accent-primary"></span>
  </button>

  <button
    class="px-4 py-2 rounded-full border border-border text-text-primary font-mono text-sm transition-all hover:border-accent-primary hover:text-accent-primary disabled:opacity-50"
    disabled={disabled || isCapturing}
    onclick={handleStrip}
  >
    {stripMode ? "Strip Mode ON" : "Photo Strip"}
  </button>
</div>
