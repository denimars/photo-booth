import { writable, derived } from "svelte/store";
import type { CameraDevice, CameraState } from "$lib/types";

const initialState: CameraState = {
  stream: null,
  devices: [],
  selectedDeviceId: null,
  isLoading: false,
  error: null,
};

function createCameraStore() {
  const { subscribe, set, update } = writable<CameraState>(initialState);

  function isMediaDevicesSupported(): boolean {
    return !!(
      typeof navigator !== "undefined" &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  }

  async function enumerateDevices(): Promise<CameraDevice[]> {
    if (!isMediaDevicesSupported()) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }));
    } catch {
      return [];
    }
  }

  async function startStream(deviceId?: string): Promise<void> {
    update((state) => ({ ...state, isLoading: true, error: null }));

    // Check if mediaDevices is supported
    if (!isMediaDevicesSupported()) {
      const devices = await enumerateDevices();
      update((state) => ({
        ...state,
        stream: null,
        devices,
        isLoading: false,
        error: "Camera API not supported. Please ensure camera permissions are enabled in system settings.",
      }));
      return;
    }

    try {
      // Stop existing stream first
      let currentState: CameraState = initialState;
      const unsubscribe = subscribe((s) => (currentState = s));
      unsubscribe();

      if (currentState.stream) {
        currentState.stream.getTracks().forEach((track) => track.stop());
      }

      // Build constraints - use ideal instead of min for better compatibility
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? {
              deviceId: { exact: deviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Enumerate devices after getting permission (labels are available after permission)
      const devices = await enumerateDevices();

      const videoTrack = stream.getVideoTracks()[0];
      const selectedDeviceId = videoTrack?.getSettings().deviceId ?? deviceId ?? null;

      update((state) => ({
        ...state,
        stream,
        devices,
        selectedDeviceId,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      // Still try to enumerate devices so user can select a different one
      const devices = await enumerateDevices();

      let message = "Failed to access camera";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          message = "Camera permission denied. Please allow camera access in System Preferences > Privacy & Security > Camera.";
        } else if (err.name === "NotFoundError") {
          message = "No camera found. Please connect a camera.";
        } else if (err.name === "NotReadableError") {
          message = "Camera is in use by another application.";
        } else if (err.name === "OverconstrainedError") {
          message = "Camera does not support the required resolution.";
        } else if (err.name === "TypeError") {
          message = "Camera API not available. Please check system permissions.";
        } else {
          message = err.message;
        }
      }

      update((state) => ({
        ...state,
        stream: null,
        devices,
        isLoading: false,
        error: message,
      }));
    }
  }

  function stopStream(): void {
    update((state) => {
      if (state.stream) {
        state.stream.getTracks().forEach((track) => track.stop());
      }
      return { ...state, stream: null };
    });
  }

  function selectDevice(deviceId: string): void {
    startStream(deviceId);
  }

  function reset(): void {
    stopStream();
    set(initialState);
  }

  return {
    subscribe,
    startStream,
    stopStream,
    selectDevice,
    reset,
    isMediaDevicesSupported,
  };
}

export const camera = createCameraStore();

export const hasCamera = derived(camera, ($camera) => $camera.stream !== null);
export const cameraError = derived(camera, ($camera) => $camera.error);
