<script lang="ts">
  import { onMount } from "svelte";
  import Camera from "$lib/components/Camera.svelte";
  import CountdownTimer from "$lib/components/CountdownTimer.svelte";
  import FilterPanel from "$lib/components/FilterPanel.svelte";
  import CaptureButton from "$lib/components/CaptureButton.svelte";
  import PhotoStrip from "$lib/components/PhotoStrip.svelte";
  import { session } from "$lib/stores/session";
  import { settings } from "$lib/stores/settings";
  import { savePhoto } from "$lib/utils/export";
  import type { FilterName } from "$lib/types";

  let cameraRef: Camera | undefined = $state();
  let countdownRef: CountdownTimer | undefined = $state();

  let selectedFilter: FilterName = $state("none");
  let isCountingDown = $state(false);
  let stripMode = $state(false);

  let shutterAudio: HTMLAudioElement | undefined = $state();
  let countdownAudio: HTMLAudioElement | undefined = $state();

  onMount(() => {
    settings.load();
    shutterAudio = new Audio("/sounds/shutter.mp3");
    countdownAudio = new Audio("/sounds/countdown.mp3");
  });

  function handleFilterChange(e: CustomEvent<FilterName>) {
    selectedFilter = e.detail;
  }

  async function handleCapture() {
    if (!cameraRef || isCountingDown) return;

    isCountingDown = true;
    session.setCapturing(true);
    countdownRef?.start();
  }

  function handleCountdownTick(e: CustomEvent<number>) {
    if ($settings.soundEnabled && countdownAudio) {
      countdownAudio.currentTime = 0;
      countdownAudio.play().catch(() => {});
    }
  }

  async function handleCountdownComplete() {
    isCountingDown = false;

    if ($settings.soundEnabled && shutterAudio) {
      shutterAudio.currentTime = 0;
      shutterAudio.play().catch(() => {});
    }

    const result = cameraRef?.capture();
    if (result) {
      if (stripMode) {
        session.addStripPhoto(result.dataUrl);
        if ($session.stripPhotos.length < $settings.stripCount) {
          setTimeout(() => handleCapture(), 500);
        } else {
          session.setCapturing(false);
        }
      } else {
        session.addPhoto(result.dataUrl, selectedFilter);
        session.setCapturing(false);
      }
    } else {
      session.setCapturing(false);
    }
  }

  function handleStartStrip() {
    stripMode = true;
    session.startStripMode();
    handleCapture();
  }

  async function handleSaveStrip(e: CustomEvent<string>) {
    try {
      await savePhoto({ dataUrl: e.detail });
      session.endStripMode();
      stripMode = false;
    } catch (err) {
      console.error("Failed to save strip:", err);
    }
  }

  function handleDiscardStrip() {
    session.endStripMode();
    stripMode = false;
  }

  async function handleSavePhoto(dataUrl: string) {
    try {
      await savePhoto({ dataUrl });
    } catch (err) {
      console.error("Failed to save photo:", err);
    }
  }
</script>

<div class="h-screen flex flex-col bg-bg-primary">
  <!-- Header -->
  <header class="flex items-center justify-between px-6 py-4 border-b border-border">
    <h1 class="text-2xl font-display text-accent-primary">Photo Booth</h1>
    <nav class="flex items-center gap-4">
      <a
        href="/gallery"
        class="text-text-muted hover:text-text-primary font-mono text-sm transition-colors"
      >
        Gallery ({$session.photos.length})
      </a>
      <button
        class="text-text-muted hover:text-text-primary font-mono text-sm transition-colors"
        onclick={() => settings.toggleMirror()}
      >
        Mirror: {$settings.mirror ? "ON" : "OFF"}
      </button>
      <button
        class="text-text-muted hover:text-text-primary font-mono text-sm transition-colors"
        onclick={() => settings.toggleSound()}
      >
        Sound: {$settings.soundEnabled ? "ON" : "OFF"}
      </button>
    </nav>
  </header>

  <!-- Main Content -->
  <main class="flex-1 flex overflow-hidden">
    <!-- Left Sidebar - Photo Strip -->
    <aside class="w-64 p-4 border-r border-border overflow-y-auto">
      <PhotoStrip
        photos={$session.stripPhotos}
        label="Photo Booth"
        on:save={handleSaveStrip}
        on:discard={handleDiscardStrip}
      />

      {#if $session.photos.length > 0 && !stripMode}
        <div class="mt-4">
          <h3 class="text-text-muted text-xs uppercase tracking-wider mb-3 font-mono">
            Recent Photos
          </h3>
          <div class="space-y-2">
            {#each $session.photos.slice(-3).reverse() as photo}
              <div class="relative group">
                <img
                  src={photo.dataUrl}
                  alt="Recent"
                  class="w-full aspect-video object-cover rounded border border-border"
                />
                <button
                  class="absolute bottom-2 right-2 px-2 py-1 bg-bg-primary/80 rounded text-xs font-mono text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  onclick={() => handleSavePhoto(photo.dataUrl)}
                >
                  Save
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </aside>

    <!-- Center - Camera View -->
    <div class="flex-1 flex flex-col p-4">
      <div class="flex-1 relative rounded-lg overflow-hidden">
        <Camera
          bind:this={cameraRef}
          mirror={$settings.mirror}
          {selectedFilter}
        />

        <CountdownTimer
          bind:this={countdownRef}
          duration={$settings.countdownDuration}
          on:tick={handleCountdownTick}
          on:complete={handleCountdownComplete}
        />
      </div>

      <!-- Capture Controls -->
      <div class="flex justify-center py-6">
        <CaptureButton
          disabled={$session.isCapturing && !isCountingDown}
          isCapturing={isCountingDown}
          {stripMode}
          on:capture={handleCapture}
          on:strip={handleStartStrip}
        />
      </div>
    </div>

    <!-- Right Sidebar - Filters & Settings -->
    <aside class="w-64 p-4 border-l border-border overflow-y-auto">
      <FilterPanel selected={selectedFilter} on:change={handleFilterChange} />

      <div class="mt-6">
        <h3 class="text-text-muted text-xs uppercase tracking-wider mb-3 font-mono">
          Settings
        </h3>

        <div class="space-y-4">
          <div>
            <span class="block text-sm font-mono text-text-muted mb-1">Countdown</span>
            <div class="flex gap-2">
              {#each [3, 5, 10] as dur}
                <button
                  class="flex-1 px-2 py-1 rounded border text-sm font-mono transition-colors {$settings.countdownDuration === dur ? 'border-accent-primary text-accent-primary' : 'border-border text-text-muted hover:border-text-muted hover:text-text-primary'}"
                  onclick={() => settings.setCountdown(dur as 3 | 5 | 10)}
                >
                  {dur}s
                </button>
              {/each}
            </div>
          </div>

          <div>
            <span class="block text-sm font-mono text-text-muted mb-1">Strip Count</span>
            <div class="flex gap-2">
              {#each [3, 4] as count}
                <button
                  class="flex-1 px-2 py-1 rounded border text-sm font-mono transition-colors {$settings.stripCount === count ? 'border-accent-primary text-accent-primary' : 'border-border text-text-muted hover:border-text-muted hover:text-text-primary'}"
                  onclick={() => settings.setStripCount(count as 3 | 4)}
                >
                  {count} photos
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </aside>
  </main>
</div>
