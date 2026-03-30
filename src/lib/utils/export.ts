import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { pictureDir } from "@tauri-apps/api/path";
import { dataUrlToBase64 } from "./canvas";

export interface SaveOptions {
  dataUrl: string;
  filename?: string;
  directory?: string;
}

export function generateFilename(prefix = "photobooth"): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
  return `${prefix}_${date}_${time}.jpg`;
}

export async function savePhoto(options: SaveOptions): Promise<string | null> {
  const { dataUrl, filename = generateFilename(), directory } = options;

  try {
    // Use dialog if no directory specified
    let savePath: string | null = null;

    if (directory) {
      savePath = `${directory}/${filename}`;
    } else {
      const defaultDir = await pictureDir();
      savePath = await save({
        defaultPath: `${defaultDir}/PhotoBooth/${filename}`,
        filters: [
          { name: "Images", extensions: ["jpg", "jpeg", "png"] },
        ],
      });
    }

    if (!savePath) {
      return null;
    }

    const base64Data = dataUrlToBase64(dataUrl);
    const result = await invoke<string>("save_photo", {
      data: base64Data,
      filePath: savePath,
    });

    return result;
  } catch (err) {
    console.error("Failed to save photo:", err);
    throw err;
  }
}

export async function getDefaultSaveDirectory(): Promise<string> {
  const pictures = await pictureDir();
  return `${pictures}/PhotoBooth`;
}

export async function printPhoto(dataUrl: string): Promise<void> {
  const base64Data = dataUrlToBase64(dataUrl);

  try {
    await invoke("print_photo", { data: base64Data });
  } catch (err) {
    console.error("Failed to print photo:", err);
    throw err;
  }
}
