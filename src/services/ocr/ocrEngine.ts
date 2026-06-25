import TextRecognition, {
  TextRecognitionScript,
} from "@react-native-ml-kit/text-recognition";

import { deleteLocalFiles } from "./fileCleanup";
import { preprocessImageForOcr } from "./imagePreprocessor";
import { buildLlmOcrContext, type LlmContextProfile } from "./llmContextBuilder";
import { cleanOcrText, countLines } from "./textPostProcessor";
import type {
  OcrError,
  OcrImageSource,
  OcrPipelineResult,
  OcrProcessingOptions,
} from "./types";

function createError(code: OcrError["code"], message: string): OcrError {
  return { code, message };
}

/**
 * Runs the full offline OCR pipeline:
 * preprocess → ML Kit recognize → clean text → build LLM context.
 */
export async function runOcrPipeline(
  imageUri: string,
  source: OcrImageSource,
  profile: LlmContextProfile,
  options: OcrProcessingOptions = {},
): Promise<OcrPipelineResult> {
  const cleanup = options.cleanupTempFiles ?? true;
  let preprocessedUri: string | null = null;

  try {
    const preprocessed = await preprocessImageForOcr(imageUri, options);
    preprocessedUri = preprocessed.uri;

    const ocrResult = await TextRecognition.recognize(
      preprocessed.uri,
      TextRecognitionScript.LATIN,
    );

    const rawText = ocrResult.text.trim();
    if (!rawText) {
      throw createError(
        "NO_TEXT_FOUND",
        "No readable text was found in this image.",
      );
    }

    const cleanedText = cleanOcrText(rawText);
    if (!cleanedText) {
      throw createError(
        "NO_TEXT_FOUND",
        "Text was detected but could not be cleaned into readable content.",
      );
    }

    const result = {
      rawText,
      cleanedText,
      blockCount: ocrResult.blocks.length,
      lineCount: countLines(cleanedText),
      source,
      processedAt: new Date().toISOString(),
    };

    return {
      result,
      llmContext: buildLlmOcrContext(cleanedText, profile),
    };
  } catch (error) {
    if (isOcrError(error)) throw error;

    const message =
      error instanceof Error ? error.message : "OCR processing failed.";
    throw createError("RECOGNITION_FAILED", message);
  } finally {
    if (cleanup) {
      const urisToDelete =
        preprocessedUri && preprocessedUri !== imageUri
          ? [imageUri, preprocessedUri]
          : [imageUri];
      await deleteLocalFiles(urisToDelete);
    }
  }
}

function isOcrError(error: unknown): error is OcrError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}
