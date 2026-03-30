<script lang="ts">
  import { createEventDispatcher } from "svelte";

  interface Props {
    duration?: number;
    autoStart?: boolean;
  }

  let { duration = 3, autoStart = false }: Props = $props();

  const dispatch = createEventDispatcher<{
    tick: number;
    complete: void;
  }>();

  let remaining = $state(duration);
  let isRunning = $state(false);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  $effect(() => {
    if (autoStart) {
      start();
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  });

  export function start(): void {
    if (isRunning) return;

    remaining = duration;
    isRunning = true;

    intervalId = setInterval(() => {
      remaining -= 1;
      dispatch("tick", remaining);

      if (remaining <= 0) {
        stop();
        dispatch("complete");
      }
    }, 1000);
  }

  export function stop(): void {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isRunning = false;
  }

  export function reset(): void {
    stop();
    remaining = duration;
  }
</script>

{#if isRunning && remaining > 0}
  <div
    class="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
  >
    <div class="text-[clamp(8rem,30vw,20rem)] font-display text-accent-primary animate-pulse drop-shadow-[0_0_40px_#f5c518]">
      {remaining}
    </div>
  </div>
{/if}
