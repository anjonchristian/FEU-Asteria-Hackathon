import * as FileSystem from "expo-file-system/legacy";

const MODEL_FILENAME = "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf";
const MODEL_URL = `https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/${MODEL_FILENAME}`;

// Use a dedicated directory for the model to avoid permission issues
const MODEL_DIR = `${FileSystem.documentDirectory}models/`;
export const MODEL_PATH = `${MODEL_DIR}${MODEL_FILENAME}`;

export async function checkModelExists(): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(MODEL_PATH);
    if (fileInfo.exists && fileInfo.size && fileInfo.size > 100_000_000) {
      // Model should be at least 100MB. If smaller, it's corrupted.
      console.log(
        `[ModelManager] Model found: ${(fileInfo.size / 1_000_000).toFixed(1)}MB`,
      );
      return true;
    }
    if (fileInfo.exists) {
      console.warn(
        "[ModelManager] Model file exists but appears too small. Re-downloading...",
      );
      await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
    }
    return false;
  } catch (error) {
    console.error("[ModelManager] Error checking model path:", error);
    return false;
  }
}

let activeDownload: FileSystem.DownloadResumable | null = null;

export async function downloadModel(
  onProgress: (progress: number) => void,
): Promise<string> {
  // Ensure model directory exists
  const dirInfo = await FileSystem.getInfoAsync(MODEL_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  }

  const exists = await checkModelExists();
  if (exists) {
    onProgress(1);
    return MODEL_PATH;
  }

  // Cancel any existing download
  if (activeDownload) {
    try {
      await activeDownload.cancelAsync();
    } catch {
      // Ignore cleanup error
    }
    activeDownload = null;
  }

  console.log(`[ModelManager] Starting download to: ${MODEL_PATH}`);

  activeDownload = FileSystem.createDownloadResumable(
    MODEL_URL,
    MODEL_PATH,
    {},
    (downloadProgress) => {
      const progress =
        downloadProgress.totalBytesWritten /
        downloadProgress.totalBytesExpectedToWrite;
      onProgress(progress);
    },
  );

  try {
    const result = await activeDownload.downloadAsync();
    activeDownload = null;

    if (!result || !result.uri) {
      throw new Error("Download completed but URI is missing");
    }

    // Verify the downloaded file
    const fileInfo: any = await FileSystem.getInfoAsync(result.uri);
    console.log(
      `[ModelManager] Download complete: ${(fileInfo.size! / 1_000_000).toFixed(1)}MB`,
    );

    if (fileInfo.size! < 100_000_000) {
      throw new Error(
        "Downloaded file is too small. Download may be corrupted.",
      );
    }

    return result.uri;
  } catch (error) {
    activeDownload = null;
    // Clean up partial download
    try {
      await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
    } catch {}
    throw error;
  }
}

export async function cancelDownload(): Promise<void> {
  if (activeDownload) {
    try {
      await activeDownload.cancelAsync();
      console.log("[ModelManager] Model download cancelled.");
    } catch (error) {
      console.error("[ModelManager] Error cancelling download:", error);
    } finally {
      activeDownload = null;
    }
  }
}

export async function deleteModelFile(): Promise<void> {
  try {
    const exists = await checkModelExists();
    if (exists) {
      await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
      console.log("[ModelManager] Model file deleted successfully.");
    }
  } catch (error) {
    console.error("[ModelManager] Error deleting model file:", error);
  }
}
