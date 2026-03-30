import type { BackgroundId, StripBackground } from "$lib/types";

export const backgrounds: Record<BackgroundId, StripBackground> = {
  "classic-film": {
    id: "classic-film",
    name: "Classic Film",
    preview: "/backgrounds/classic-film.svg",
    photoPositions: [
      { x: 50, y: 40, width: 300, height: 225 },
      { x: 50, y: 295, width: 300, height: 225 },
      { x: 50, y: 550, width: 300, height: 225 },
      { x: 50, y: 805, width: 300, height: 225 },
    ],
  },
  "elegant-white": {
    id: "elegant-white",
    name: "Elegant White",
    preview: "/backgrounds/elegant-white.svg",
    photoPositions: [
      { x: 45, y: 50, width: 310, height: 232 },
      { x: 45, y: 307, width: 310, height: 232 },
      { x: 45, y: 564, width: 310, height: 232 },
      { x: 45, y: 821, width: 310, height: 232 },
    ],
  },
  "neon-pink": {
    id: "neon-pink",
    name: "Neon Party",
    preview: "/backgrounds/neon-pink.svg",
    photoPositions: [
      { x: 45, y: 55, width: 310, height: 230 },
      { x: 45, y: 320, width: 310, height: 230 },
      { x: 45, y: 585, width: 310, height: 230 },
      { x: 45, y: 850, width: 310, height: 230 },
    ],
  },
};

export const backgroundList = Object.values(backgrounds);

export function getBackground(id: BackgroundId): StripBackground {
  return backgrounds[id];
}
