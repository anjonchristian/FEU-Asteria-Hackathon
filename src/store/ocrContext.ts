import { create } from "zustand";

import type { LlmOcrContext, ProcessedOcrResult } from "../services/ocr/types";

interface OcrContextState {
  lastResult: ProcessedOcrResult | null;
  llmContext: LlmOcrContext | null;

  setScanContext: (
    result: ProcessedOcrResult,
    llmContext: LlmOcrContext,
  ) => void;
  clearScanContext: () => void;
}

export const useOcrContextStore = create<OcrContextState>((set) => ({
  lastResult: null,
  llmContext: null,

  setScanContext: (result, llmContext) => set({ lastResult: result, llmContext }),
  clearScanContext: () => set({ lastResult: null, llmContext: null }),
}));
