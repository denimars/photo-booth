export type FilterName =
  | "none"
  | "grayscale"
  | "sepia"
  | "vivid"
  | "cool"
  | "warm"
  | "noir";

export interface Filter {
  name: FilterName;
  label: string;
  css: string;
}

export interface Photo {
  id: string;
  dataUrl: string;
  timestamp: number;
  filter: FilterName;
}

export interface CaptureEvent {
  dataUrl: string;
  timestamp: number;
}

export interface Settings {
  countdownDuration: number;
  defaultFilter: FilterName;
  saveDirectory: string;
  stripCount: number;
  mirror: boolean;
  soundEnabled: boolean;
  selectedBackground: BackgroundId;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export interface CameraState {
  stream: MediaStream | null;
  devices: CameraDevice[];
  selectedDeviceId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface SessionState {
  photos: Photo[];
  isCapturing: boolean;
  isStripMode: boolean;
  stripPhotos: string[];
}

export type CountdownDuration = 3 | 5 | 10;
export type StripCount = 3 | 4;

export type BackgroundId = "classic-film" | "elegant-white" | "neon-pink";

export interface StripBackground {
  id: BackgroundId;
  name: string;
  preview: string;
  photoPositions: { x: number; y: number; width: number; height: number }[];
}
