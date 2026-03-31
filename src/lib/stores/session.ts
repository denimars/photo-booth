import { writable, derived } from "svelte/store";
import type { Photo, SessionState, FilterName } from "$lib/types";

const initialState: SessionState = {
  photos: [],
  isCapturing: false,
  isStripMode: false,
  stripPhotos: [],
};

function createSessionStore() {
  const { subscribe, set, update } = writable<SessionState>(initialState);

  function addPhoto(dataUrl: string, filter: FilterName): Photo {
    const photo: Photo = {
      id: crypto.randomUUID(),
      dataUrl,
      timestamp: Date.now(),
      filter,
    };

    update((state) => ({
      ...state,
      photos: [...state.photos, photo],
    }));

    return photo;
  }

  function removePhoto(id: string): void {
    update((state) => ({
      ...state,
      photos: state.photos.filter((p) => p.id !== id),
    }));
  }

  function setCapturing(isCapturing: boolean): void {
    update((state) => ({ ...state, isCapturing }));
  }

  function startStripMode(): void {
    update((state) => ({
      ...state,
      isStripMode: true,
      stripPhotos: [],
    }));
  }

  function addStripPhoto(dataUrl: string): void {
    update((state) => ({
      ...state,
      stripPhotos: [...state.stripPhotos, dataUrl],
    }));
  }

  function removeStripPhoto(index: number): void {
    update((state) => ({
      ...state,
      stripPhotos: state.stripPhotos.filter((_, i) => i !== index),
    }));
  }

  function replaceStripPhoto(index: number, dataUrl: string): void {
    update((state) => ({
      ...state,
      stripPhotos: state.stripPhotos.map((photo, i) => (i === index ? dataUrl : photo)),
    }));
  }

  function endStripMode(): void {
    update((state) => ({
      ...state,
      isStripMode: false,
      stripPhotos: [],
    }));
  }

  function clearSession(): void {
    set(initialState);
  }

  return {
    subscribe,
    addPhoto,
    removePhoto,
    setCapturing,
    startStripMode,
    addStripPhoto,
    removeStripPhoto,
    replaceStripPhoto,
    endStripMode,
    clearSession,
  };
}

export const session = createSessionStore();

export const photoCount = derived(session, ($session) => $session.photos.length);
export const stripProgress = derived(session, ($session) => $session.stripPhotos.length);

// Helper to check if strip is ready for editing (has photos)
export function isStripReady(stripPhotos: string[], requiredCount: number): boolean {
  return stripPhotos.length >= requiredCount;
}
