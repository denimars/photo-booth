import type { FilterName } from "$lib/types";
import { getFilterCss } from "./filters";

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

  // Apply filter
  const filterCss = getFilterCss(filter);
  ctx.filter = filterCss;

  // Apply mirror if enabled
  if (mirror) {
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);
  }

  ctx.drawImage(video, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}

export interface StripOptions {
  photos: string[];
  padding?: number;
  label?: string;
  labelColor?: string;
  labelFont?: string;
}

export async function createPhotoStrip(options: StripOptions): Promise<string> {
  const {
    photos,
    padding = 20,
    label = "",
    labelColor = "#f5c518",
    labelFont = "bold 24px 'Playfair Display', serif",
  } = options;

  if (photos.length === 0) {
    throw new Error("No photos provided");
  }

  // Load all images
  const images = await Promise.all(
    photos.map(
      (dataUrl) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = dataUrl;
        })
    )
  );

  // Calculate dimensions
  const photoWidth = images[0].width;
  const photoHeight = images[0].height;
  const labelHeight = label ? 60 : 0;
  const totalHeight =
    photoHeight * images.length + padding * (images.length + 1) + labelHeight;
  const totalWidth = photoWidth + padding * 2;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = totalWidth;
  canvas.height = totalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Fill background
  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Draw photos
  images.forEach((img, index) => {
    const y = padding + index * (photoHeight + padding);
    ctx.drawImage(img, padding, y, photoWidth, photoHeight);
  });

  // Draw label if provided
  if (label) {
    ctx.fillStyle = labelColor;
    ctx.font = labelFont;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      label,
      totalWidth / 2,
      totalHeight - labelHeight / 2 - padding / 2
    );
  }

  return canvas.toDataURL("image/jpeg", 0.92);
}

export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/\w+;base64,/, "");
}
