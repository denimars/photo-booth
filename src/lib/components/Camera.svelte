<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { camera } from "$lib/stores/camera";
  import { getFilterCss } from "$lib/utils/filters";
  import { captureFrame } from "$lib/utils/canvas";
  import type { FilterName, CaptureEvent } from "$lib/types";

  interface Props {
    mirror?: boolean;
    selectedFilter?: FilterName;
    deviceId?: string | null;
  }

  let { mirror = true, selectedFilter = "none", deviceId = null }: Props = $props();

  const dispatch = createEventDispatcher<{
    captured: CaptureEvent;
    error: Error;
  }>();

  let videoEl: HTMLVideoElement | undefined = $state();

  $effect(() => {
    if (videoEl && $camera.stream) {
      videoEl.srcObject = $camera.stream;
    }
  });

  $effect(() => {
    if (deviceId && deviceId !== $camera.selectedDeviceId) {
      camera.selectDevice(deviceId);
    }
  });

  onMount(() => {
    camera.startStream(deviceId ?? undefined);
  });

  onDestroy(() => {
    camera.stopStream();
  });

  function handleRetry() {
    camera.startStream($camera.selectedDeviceId ?? undefined);
  }

  function handleDeviceChange(e: Event) {
    const target = e.currentTarget as HTMLSelectElement;
    camera.selectDevice(target.value);
  }

  export function capture(): CaptureEvent | null {
    if (!videoEl) return null;

    try {
      const dataUrl = captureFrame(videoEl, {
        filter: selectedFilter,
        mirror,
      });

      const event: CaptureEvent = {
        dataUrl,
        timestamp: Date.now(),
      };

      dispatch("captured", event);
      return event;
    } catch (err) {
      dispatch("error", err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }

  const filterStyle = $derived(getFilterCss(selectedFilter));
</script>

<div class="relative w-full h-full bg-bg-surface rounded-lg overflow-hidden">
  {#if $camera.isLoading}
    <div class="absolute inset-0 flex items-center justify-center">
      <div class="text-text-muted font-mono">Initializing camera...</div>
    </div>
  {:else if $camera.error}
    <div class="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
      <div class="text-accent-secondary font-mono text-center max-w-md">
        <p class="mb-2 text-lg">Camera Error</p>
        <p class="text-sm text-text-muted mb-4">{$camera.error}</p>

        <div class="text-left text-xs text-text-muted bg-bg-primary p-4 rounded mb-4">
          <p class="font-bold mb-2">Troubleshooting:</p>
          <ol class="list-decimal list-inside space-y-1">
            <li>Open <span class="text-accent-primary">System Settings</span></li>
            <li>Go to <span class="text-accent-primary">Privacy & Security → Camera</span></li>
            <li>Enable camera access for this app or Terminal</li>
            <li>Restart the application</li>
          </ol>
        </div>

        {#if $camera.devices.length > 0}
          <div class="mb-4">
            <label class="block text-xs text-text-muted mb-2">Select Camera:</label>
            <select
              class="bg-bg-primary text-text-primary border border-border rounded px-3 py-2 text-sm font-mono w-full"
              value={$camera.selectedDeviceId}
              onchange={handleDeviceChange}
            >
              {#each $camera.devices as device}
                <option value={device.deviceId}>{device.label}</option>
              {/each}
            </select>
          </div>
        {/if}

        <button
          class="px-4 py-2 bg-accent-primary text-bg-primary rounded font-mono text-sm hover:bg-accent-primary/90 transition-colors"
          onclick={handleRetry}
        >
          Retry
        </button>
      </div>
    </div>
  {:else}
    <video
      bind:this={videoEl}
      autoplay
      playsinline
      muted
      class="w-full h-full object-cover"
      style:filter={filterStyle}
      style:transform={mirror ? "scaleX(-1)" : "none"}
    ></video>
  {/if}

  <!-- Camera selector - always visible when camera is working -->
  {#if !$camera.error && !$camera.isLoading && $camera.devices.length > 0}
    <div class="absolute top-4 right-4">
      <select
        class="bg-bg-primary/80 text-text-primary border border-border rounded px-2 py-1 text-sm font-mono backdrop-blur-sm cursor-pointer"
        value={$camera.selectedDeviceId}
        onchange={handleDeviceChange}
      >
        {#each $camera.devices as device}
          <option value={device.deviceId}>{device.label}</option>
        {/each}
      </select>
    </div>
  {/if}
</div>
