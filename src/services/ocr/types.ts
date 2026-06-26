export type OcrErrorCode =
  | "PERMISSION_DENIED"
  | "CAPTURE_FAILED"
  | "PREPROCESS_FAILED"
  | "RECOGNITION_FAILED"
  | "NO_TEXT_FOUND"
  | "GALLERY_CANCELLED";

export type OcrImageSource = "camera" | "gallery";

export interface OcrError {
  code: OcrErrorCode;
  message: string;
}

export interface OcrProcessingOptions {
  /** Max width before OCR; height scales proportionally. */
  maxWidth?: number;
  /** JPEG compression 0–1 for preprocessed image. */
  compress?: number;
  /** Delete temporary image URIs after processing. */
  cleanupTempFiles?: boolean;
}

export interface ProcessedOcrResult {
  rawText: string;
  cleanedText: string;
  blockCount: number;
  lineCount: number;
  source: OcrImageSource;
  processedAt: string;
}

export interface LlmOcrContext {
  systemContext: string;
  userPrompt: string;
  referenceText: string;
  scannedAt: string;
}

export interface OcrPipelineResult {
  result: ProcessedOcrResult;
  llmContext: LlmOcrContext;
}
