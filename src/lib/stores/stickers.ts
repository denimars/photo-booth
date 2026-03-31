import { writable } from "svelte/store";
import type { PlacedSticker, StickerId } from "$lib/types";

function createStickersStore() {
  const { subscribe, set, update } = writable<PlacedSticker[]>([]);

  function addSticker(stickerId: StickerId, x: number, y: number): string {
    const id = crypto.randomUUID();
    const newSticker: PlacedSticker = {
      id,
      stickerId,
      x,
      y,
      width: 80,
      height: 80,
      rotation: 0,
    };

    update((stickers) => [...stickers, newSticker]);
    return id;
  }

  function updateSticker(id: string, updates: Partial<PlacedSticker>): void {
    update((stickers) =>
      stickers.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }

  function removeSticker(id: string): void {
    update((stickers) => stickers.filter((s) => s.id !== id));
  }

  function clearStickers(): void {
    set([]);
  }

  return {
    subscribe,
    addSticker,
    updateSticker,
    removeSticker,
    clearStickers,
  };
}

export const placedStickers = createStickersStore();
