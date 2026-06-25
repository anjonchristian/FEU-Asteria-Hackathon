import { File } from "expo-file-system";

/** Best-effort delete of a local file URI; failures are ignored. */
export async function deleteLocalFile(uri: string | null | undefined): Promise<void> {
  if (!uri) return;

  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Temp files may already be gone; cleanup must not block OCR flow.
  }
}

export async function deleteLocalFiles(
  uris: Array<string | null | undefined>,
): Promise<void> {
  await Promise.all(uris.map(deleteLocalFile));
}
