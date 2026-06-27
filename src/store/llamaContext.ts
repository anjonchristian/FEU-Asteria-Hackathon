/**
 * Singleton Zustand store for the llama.rn LlamaContext.
 *
 * One LlamaContext is expensive — it allocates the KV cache and loads weights
 * into memory. Keep exactly one alive at a time and reuse it across calls.
 *
 * Usage (React):
 *   const { loadModel, status } = useLlamaStore();
 *
 * Usage (service layer):
 *   const ctx = getLlamaContext();  // returns null if not ready
 */

import { initLlama, type LlamaContext } from "llama.rn";
import { create } from "zustand";

export type ModelStatus = "idle" | "loading" | "ready" | "error";

interface LlamaStore {
  context: LlamaContext | null;
  status: ModelStatus;
  error: string | null;
  /** Absolute path of the currently loaded .gguf file. */
  modelPath: string | null;

  /**
   * Loads the model at `path`. No-ops if the same model is already ready.
   * Releases an existing context first if a different model is requested.
   */
  loadModel: (path: string, options?: ModelOptions) => Promise<void>;

  /** Gracefully releases the context and resets to idle. */
  releaseModel: () => Promise<void>;
}

export interface ModelOptions {
  /** Max tokens in the KV cache. Default: 2048 */
  nCtx?: number;
  /** Batch size for prompt processing. Default: 512 */
  nBatch?: number;
  /** CPU threads. Default: 4 (tune per device) */
  nThreads?: number;
  /** Lock model weights in RAM to prevent swapping. Default: true */
  useMlock?: boolean;
}

const DEFAULT_OPTIONS: Required<ModelOptions> = {
  nCtx: 2048,
  nBatch: 512,
  nThreads: 4,
  useMlock: true,
};

export const useLlamaStore = create<LlamaStore>((set, get) => ({
  context: null,
  status: "idle",
  error: null,
  modelPath: null,

  loadModel: async (path, options = {}) => {
    const state = get();

    // Already loaded with the same model — do nothing.
    if (state.status === "ready" && state.modelPath === path) return;
    // Already loading — prevent a double-init race.
    if (state.status === "loading") return;

    set({ status: "loading", error: null });

    try {
      // Release the old context before loading a new one.
      if (state.context) {
        await state.context.release();
      }

      const cfg = { ...DEFAULT_OPTIONS, ...options };

      const context = await initLlama({
        model: path,
        use_mlock: cfg.useMlock,
        n_ctx: cfg.nCtx,
        n_batch: cfg.nBatch,
        n_threads: cfg.nThreads,
      });

      set({ context, status: "ready", modelPath: path, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to initialise model";
      set({ status: "error", error: message, context: null });
      throw err;
    }
  },

  releaseModel: async () => {
    const { context } = get();
    if (context) {
      await context.release();
    }
    set({ context: null, status: "idle", modelPath: null, error: null });
  },
}));

/**
 * Synchronous getter for the active LlamaContext.
 * Returns `null` when the model is not ready.
 * Intended for service-layer code that runs outside React components.
 */
export const getLlamaContext = (): LlamaContext | null =>
  useLlamaStore.getState().context;
