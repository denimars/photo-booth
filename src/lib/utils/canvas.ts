import type { FilterName, BackgroundId, PlacedSticker } from "$lib/types";
import { getBackground } from "./backgrounds";
import { getStickerById } from "./stickers";

export interface CaptureOptions {
  filter: FilterName;
  mirror: boolean;
  quality?: number;
}

export function captureFrame(
  video: HTMLVideoElement,
  options: CaptureOptions
): string {
  const { filter, mirror, quality = 0.92 } = options;
  const width = video.videoWidth;
  const height = video.videoHeight;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Apply mirror if enabled
  if (mirror) {
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);
  }

  ctx.drawImage(video, 0, 0, width, height);

  // Apply filter using pixel manipulation (ctx.filter doesn't work in WebKit)
  if (filter !== "none") {
    applyFilter(ctx, width, height, filter);
  }

  return canvas.toDataURL("image/jpeg", quality);
}

function applyFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: FilterName
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    switch (filter) {
      case "grayscale": {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
        break;
      }
      case "sepia": {
        const sr = 0.393 * r + 0.769 * g + 0.189 * b;
        const sg = 0.349 * r + 0.686 * g + 0.168 * b;
        const sb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = sr;
        g = sg;
        b = sb;
        break;
      }
      case "vivid": {
        // Increase saturation and contrast
        const avgVivid = (r + g + b) / 3;
        r = clamp(avgVivid + (r - avgVivid) * 1.5);
        g = clamp(avgVivid + (g - avgVivid) * 1.5);
        b = clamp(avgVivid + (b - avgVivid) * 1.5);
        // Apply contrast
        r = clamp((r - 128) * 1.1 + 128);
        g = clamp((g - 128) * 1.1 + 128);
        b = clamp((b - 128) * 1.1 + 128);
        break;
      }
      case "cool": {
        // Blue tint with slight desaturation
        const avgCool = (r + g + b) / 3;
        r = clamp(avgCool + (r - avgCool) * 0.9 - 10);
        g = clamp(avgCool + (g - avgCool) * 0.9);
        b = clamp(avgCool + (b - avgCool) * 0.9 + 20);
        break;
      }
      case "warm": {
        // Orange/warm tint with increased saturation
        const avgWarm = (r + g + b) / 3;
        r = clamp(avgWarm + (r - avgWarm) * 1.2 + 15);
        g = clamp(avgWarm + (g - avgWarm) * 1.2 + 5);
        b = clamp(avgWarm + (b - avgWarm) * 1.2 - 10);
        break;
      }
      case "noir": {
        // High contrast black & white
        const gray2 = 0.299 * r + 0.587 * g + 0.114 * b;
        const contrast = clamp((gray2 - 128) * 1.4 + 128);
        const darkened = clamp(contrast * 0.9);
        r = g = b = darkened;
        break;
      }
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  ctx.putImageData(imageData, 0, 0);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, value));
}

export interface StripOptions {
  photos: string[];
  backgroundId: BackgroundId;
  stickers?: PlacedSticker[];
  containerWidth?: number;
  containerHeight?: number;
}

export async function createPhotoStrip(options: StripOptions): Promise<string> {
  const { photos, backgroundId, stickers = [], containerWidth, containerHeight } = options;

  if (photos.length === 0) {
    throw new Error("No photos provided");
  }

  const background = getBackground(backgroundId);

  // Load background image
  const bgImg = await loadImage(background.preview);

  // Load all photo images
  const photoImages = await Promise.all(photos.map(loadImage));

  // Create canvas with background dimensions
  const canvas = document.createElement("canvas");
  canvas.width = bgImg.width;
  canvas.height = bgImg.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Draw background
  ctx.drawImage(bgImg, 0, 0);

  // Draw photos at their designated positions
  const positions = background.photoPositions;
  photoImages.forEach((img, index) => {
    if (index < positions.length) {
      const pos = positions[index];
      // Draw photo to fit the position while maintaining aspect ratio
      drawImageCover(ctx, img, pos.x, pos.y, pos.width, pos.height);
    }
  });

  // Draw stickers if any
  if (stickers.length > 0 && containerWidth && containerHeight) {
    // Calculate scale factor from container to canvas
    const scaleX = bgImg.width / containerWidth;
    const scaleY = bgImg.height / containerHeight;

    // Load and draw each sticker
    for (const sticker of stickers) {
      const stickerData = getStickerById(sticker.stickerId);
      if (!stickerData) continue;

      try {
        const stickerImg = await loadImage(stickerData.src);

        // Calculate position and size on canvas
        const canvasX = sticker.x * scaleX;
        const canvasY = sticker.y * scaleY;
        const canvasWidth = sticker.width * scaleX;
        const canvasHeight = sticker.height * scaleY;

        // Save context, apply rotation, draw, restore
        ctx.save();
        ctx.translate(canvasX + canvasWidth / 2, canvasY + canvasHeight / 2);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.drawImage(stickerImg, -canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);
        ctx.restore();
      } catch (err) {
        console.error("Failed to load sticker:", err);
      }
    }
  }

  return canvas.toDataURL("image/jpeg", 0.95);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const imgRatio = img.width / img.height;
  const targetRatio = width / height;

  let srcX = 0;
  let srcY = 0;
  let srcWidth = img.width;
  let srcHeight = img.height;

  if (imgRatio > targetRatio) {
    // Image is wider - crop sides
    srcWidth = img.height * targetRatio;
    srcX = (img.width - srcWidth) / 2;
  } else {
    // Image is taller - crop top/bottom
    srcHeight = img.width / targetRatio;
    srcY = (img.height - srcHeight) / 2;
  }

  ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, x, y, width, height);
}

export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/\w+;base64,/, "");
}
