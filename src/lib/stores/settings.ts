import { writable } from "svelte/store";
import { invoke } from "@tauri-apps/api/core";
import type { Settings, FilterName, CountdownDuration, StripCount, BackgroundId } from "$lib/types";

const defaultSettings: Settings = {
  countdownDuration: 3,
  defaultFilter: "none",
  saveDirectory: "",
  stripCount: 4,
  mirror: true,
  soundEnabled: true,
  selectedBackground: "classic-film",
};

function createSettingsStore() {
  const { subscribe, set, update } = writable<Settings>(defaultSettings);

  async function load(): Promise<void> {
    try {
      const settings = await invoke<Settings>("get_settings");
      set(settings);
    } catch {
      // Use defaults if loading fails
      set(defaultSettings);
    }
  }

  async function save(): Promise<void> {
    let currentSettings: Settings = defaultSettings;
    const unsubscribe = subscribe((s) => (currentSettings = s));
    unsubscribe();

    try {
      await invoke("save_settings", { settings: currentSettings });
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  }

  function setCountdown(duration: CountdownDuration): void {
    update((s) => ({ ...s, countdownDuration: duration }));
  }

  function setDefaultFilter(filter: FilterName): void {
    update((s) => ({ ...s, defaultFilter: filter }));
  }

  function setSaveDirectory(directory: string): void {
    update((s) => ({ ...s, saveDirectory: directory }));
  }

  function setStripCount(count: StripCount): void {
    update((s) => ({ ...s, stripCount: count }));
  }

  function toggleMirror(): void {
    update((s) => ({ ...s, mirror: !s.mirror }));
  }

  function toggleSound(): void {
    update((s) => ({ ...s, soundEnabled: !s.soundEnabled }));
  }

  function setBackground(background: BackgroundId): void {
    update((s) => ({ ...s, selectedBackground: background }));
  }

  return {
    subscribe,
    load,
    save,
    setCountdown,
    setDefaultFilter,
    setSaveDirectory,
    setStripCount,
    toggleMirror,
    toggleSound,
    setBackground,
  };
}

export const settings = createSettingsStore();
