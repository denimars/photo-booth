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
    endStripMode,
    clearSession,
  };
}

export const session = createSessionStore();

export const photoCount = derived(session, ($session) => $session.photos.length);
export const stripProgress = derived(session, ($session) => $session.stripPhotos.length);
