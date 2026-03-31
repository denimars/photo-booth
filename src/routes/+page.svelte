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
  let retakeIndex: number | null = $state(null);

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
      if (retakeIndex !== null) {
        // Replace the photo at retake index
        session.replaceStripPhoto(retakeIndex, result.dataUrl);
        retakeIndex = null;
        session.setCapturing(false);
      } else {
        session.addStripPhoto(result.dataUrl);
        // Continue capturing if we haven't reached the required count
        if ($session.stripPhotos.length < $settings.stripCount) {
          setTimeout(() => handleCapture(), 500);
        } else {
          session.setCapturing(false);
        }
      }
    } else {
      session.setCapturing(false);
      retakeIndex = null;
    }
  }

  function handleStartStrip() {
    session.startStripMode();
    handleCapture();
  }

  function handleRetake(index: number) {
    if (isCountingDown || $session.isCapturing) return;
    retakeIndex = index;
    handleCapture();
  }

  function handleReset() {
    session.endStripMode();
    retakeIndex = null;
  }

  function handleProceedToEdit() {
    goto("/edit");
  }

  const photosTaken = $derived($session.stripPhotos.length);
  const photosRequired = $derived($settings.stripCount);
  const isStripComplete = $derived(photosTaken >= photosRequired);
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
    <!-- Left Sidebar - Photo Preview -->
    <aside class="w-56 p-4 border-r border-border overflow-y-auto flex flex-col">
      <h3 class="text-text-muted text-xs uppercase tracking-wider mb-3 font-mono">
        Photos ({photosTaken}/{photosRequired})
      </h3>

      <div class="flex-1 space-y-3">
        {#each Array(photosRequired) as _, index}
          <div class="relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-colors {$session.stripPhotos[index] ? 'border-accent-primary' : 'border-border border-dashed'}">
            {#if $session.stripPhotos[index]}
              <img
                src={$session.stripPhotos[index]}
                alt="Photo {index + 1}"
                class="w-full h-full object-cover"
              />
              <!-- Retake button overlay -->
              <button
                class="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                onclick={() => handleRetake(index)}
                disabled={isCountingDown || $session.isCapturing}
              >
                <span class="text-white text-xs font-mono bg-accent-primary px-2 py-1 rounded">
                  Retake
                </span>
              </button>
              <!-- Photo number badge -->
              <div class="absolute top-1 left-1 bg-accent-primary text-white text-xs font-mono w-5 h-5 rounded-full flex items-center justify-center">
                {index + 1}
              </div>
            {:else}
              <div class="w-full h-full flex items-center justify-center bg-bg-surface">
                <span class="text-text-muted text-xs font-mono">{index + 1}</span>
              </div>
            {/if}
            <!-- Retaking indicator -->
            {#if retakeIndex === index && isCountingDown}
              <div class="absolute inset-0 bg-accent-primary/20 flex items-center justify-center">
                <span class="text-accent-primary text-xs font-mono">Retaking...</span>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Action buttons -->
      <div class="mt-4 space-y-2">
        {#if isStripComplete}
          <button
            class="w-full py-2 px-3 bg-accent-primary text-white rounded-lg font-mono text-sm hover:bg-accent-primary/90 transition-colors"
            onclick={handleProceedToEdit}
          >
            Continue to Edit
          </button>
        {/if}
        {#if photosTaken > 0}
          <button
            class="w-full py-2 px-3 border border-border text-text-muted rounded-lg font-mono text-sm hover:border-text-muted hover:text-text-primary transition-colors"
            onclick={handleReset}
            disabled={isCountingDown || $session.isCapturing}
          >
            Start Over
          </button>
        {/if}
      </div>
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

        <!-- Photo counter overlay -->
        {#if $session.isCapturing && retakeIndex === null}
          <div class="absolute top-4 left-4 bg-bg-primary/80 px-3 py-2 rounded-lg backdrop-blur-sm">
            <span class="font-mono text-accent-primary text-lg">
              {photosTaken + 1} / {photosRequired}
            </span>
          </div>
        {/if}

        <!-- Retake indicator overlay -->
        {#if retakeIndex !== null && isCountingDown}
          <div class="absolute top-4 left-4 bg-bg-primary/80 px-3 py-2 rounded-lg backdrop-blur-sm">
            <span class="font-mono text-accent-primary text-lg">
              Retaking photo {retakeIndex + 1}
            </span>
          </div>
        {/if}
      </div>

      <!-- Capture Controls -->
      <div class="flex justify-center py-6">
        {#if isStripComplete && !$session.isCapturing}
          <div class="text-center">
            <p class="text-text-muted font-mono text-sm mb-2">All photos captured!</p>
            <p class="text-text-muted font-mono text-xs">Click on any photo to retake, or continue to edit.</p>
          </div>
        {:else}
          <CaptureButton
            disabled={$session.isCapturing && !isCountingDown}
            isCapturing={isCountingDown}
            stripMode={true}
            on:capture={handleCapture}
            on:strip={handleStartStrip}
          />
        {/if}
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
