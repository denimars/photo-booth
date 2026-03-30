<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import Camera from "$lib/components/Camera.svelte";
  import CountdownTimer from "$lib/components/CountdownTimer.svelte";
  import FilterPanel from "$lib/components/FilterPanel.svelte";
  import CaptureButton from "$lib/components/CaptureButton.svelte";
  import { session } from "$lib/stores/session";
  import { settings } from "$lib/stores/settings";
  import type { FilterName } from "$lib/types";

  let cameraRef: Camera | undefined = $state();
  let countdownRef: CountdownTimer | undefined = $state();

  let selectedFilter: FilterName = $state("none");
  let isCountingDown = $state(false);

  let shutterAudio: HTMLAudioElement | undefined = $state();
  let countdownAudio: HTMLAudioElement | undefined = $state();

  onMount(() => {
    settings.load();
    // Clear any previous strip photos when returning to capture page
    session.endStripMode();
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
      session.addStripPhoto(result.dataUrl);
      // Continue capturing if we haven't reached the required count
      if ($session.stripPhotos.length < $settings.stripCount) {
        setTimeout(() => handleCapture(), 500);
      } else {
        session.setCapturing(false);
        // Auto-redirect to edit page when strip is complete
        goto("/edit");
      }
    } else {
      session.setCapturing(false);
    }
  }

  function handleStartStrip() {
    session.startStripMode();
    handleCapture();
  }

  const photosTaken = $derived($session.stripPhotos.length);
  const photosRequired = $derived($settings.stripCount);
</script>

<div class="h-screen flex flex-col bg-bg-primary">
  <!-- Header -->
  <header class="flex items-center justify-between px-6 py-4 border-b border-border">
    <h1 class="text-2xl font-display text-accent-primary">Photo Booth</h1>
    <nav class="flex items-center gap-4">
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

        <!-- Photo counter overlay -->
        {#if $session.isCapturing}
          <div class="absolute top-4 left-4 bg-bg-primary/80 px-3 py-2 rounded-lg backdrop-blur-sm">
            <span class="font-mono text-accent-primary text-lg">
              {photosTaken + 1} / {photosRequired}
            </span>
          </div>
        {/if}
      </div>

      <!-- Capture Controls -->
      <div class="flex justify-center py-6">
        <CaptureButton
          disabled={$session.isCapturing && !isCountingDown}
          isCapturing={isCountingDown}
          stripMode={true}
          on:capture={handleCapture}
          on:strip={handleStartStrip}
        />
      </div>
    </div>

    <!-- Right Sidebar - Settings -->
    <aside class="w-72 p-4 border-l border-border overflow-y-auto space-y-6">
      <!-- Filter Selection -->
      <FilterPanel selected={selectedFilter} on:change={handleFilterChange} />

      <!-- Other Settings -->
      <div>
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
            <span class="block text-sm font-mono text-text-muted mb-1">Photos per Strip</span>
            <div class="flex gap-2">
              {#each [3, 4] as count}
                <button
                  class="flex-1 px-2 py-1 rounded border text-sm font-mono transition-colors {$settings.stripCount === count ? 'border-accent-primary text-accent-primary' : 'border-border text-text-muted hover:border-text-muted hover:text-text-primary'}"
                  onclick={() => settings.setStripCount(count as 3 | 4)}
                  disabled={$session.stripPhotos.length > 0}
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
