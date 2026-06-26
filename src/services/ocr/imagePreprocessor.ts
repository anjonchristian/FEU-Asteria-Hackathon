import {
  manipulateAsync,
  SaveFormat,
  type Action,
} from "expo-image-manipulator";
import { Image } from "react-native";

import type { OcrProcessingOptions } from "./types";

const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_COMPRESS = 0.82;

async function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error),
    );
  });
}

export interface PreprocessedImage {
  uri: string;
  width: number;
  height: number;
}

/** Resize and compress an image to improve OCR accuracy and memory use. */
export async function preprocessImageForOcr(
  uri: string,
  options: OcrProcessingOptions = {},
): Promise<PreprocessedImage> {
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const compress = options.compress ?? DEFAULT_COMPRESS;

  const { width, height } = await getImageSize(uri);
  const actions: Action[] = [];

  if (width > maxWidth) {
    actions.push({ resize: { width: maxWidth } });
  }

  const result = await manipulateAsync(uri, actions, {
    compress,
    format: SaveFormat.JPEG,
  });

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}
