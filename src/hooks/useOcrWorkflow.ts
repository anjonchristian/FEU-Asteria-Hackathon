import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import type { CameraView } from "expo-camera";
import { useCallback, useMemo, useState, type RefObject } from "react";
import { router } from "expo-router";

import { getOcrErrorMessage } from "../constants/ocrStrings";
import {
  runOcrPipeline,
  type OcrError,
  type OcrPipelineResult,
} from "../services/ocr";
import { useOcrContextStore } from "../store/ocrContext";
import { useProfile } from "../store/profile";

export type OcrScanState = "idle" | "processing" | "result" | "error";

export function useOcrWorkflow() {
  const { language, name, grade, subjects } = useProfile();
  const setScanContext = useOcrContextStore((s) => s.setScanContext);

  const [scanState, setScanState] = useState<OcrScanState>("idle");
  const [pipelineResult, setPipelineResult] = useState<OcrPipelineResult | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedForStudy, setSavedForStudy] = useState(false);

  const profileContext = useMemo(
    () => ({ language, name, grade, subjects }),
    [language, name, grade, subjects],
  );

  const handleOcrError = useCallback(
    (error: OcrError | unknown) => {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as OcrError).code === "string"
          ? (error as OcrError).code
          : "RECOGNITION_FAILED";

      if (code === "GALLERY_CANCELLED") {
        setScanState("idle");
        setErrorMessage(null);
        return;
      }

      setScanState("error");
      setPipelineResult(null);
      setErrorMessage(getOcrErrorMessage(language, code));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    [language],
  );

  const processImage = useCallback(
    async (uri: string, source: "camera" | "gallery") => {
      setScanState("processing");
      setPipelineResult(null);
      setErrorMessage(null);
      setSavedForStudy(false);

      try {
        const result = await runOcrPipeline(uri, source, profileContext);
        setPipelineResult(result);
        setScanState("result");
        
        // Automatically save to scan context
        setScanContext(result.result, result.llmContext);
        setSavedForStudy(true);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Automatically navigate to dedicated study session screen
        router.push("/study-session" as any);
      } catch (error) {
        handleOcrError(error);
      }
    },
    [handleOcrError, profileContext, setScanContext],
  );

  const captureFromCamera = useCallback(
    async (cameraRef: RefObject<CameraView | null>) => {
      if (!cameraRef.current) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: true,
        });

        if (!photo?.uri) {
          throw { code: "CAPTURE_FAILED", message: "Failed to capture photo" };
        }

        await processImage(photo.uri, "camera");
      } catch (error) {
        handleOcrError(error);
      }
    },
    [handleOcrError, processImage],
  );

  const pickFromGallery = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      handleOcrError({
        code: "PERMISSION_DENIED",
        message: "Media library permission denied",
      });
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });

    if (picked.canceled || !picked.assets[0]?.uri) {
      handleOcrError({ code: "GALLERY_CANCELLED", message: "Cancelled" });
      return;
    }

    await processImage(picked.assets[0].uri, "gallery");
  }, [handleOcrError, processImage]);

  const saveForStudy = useCallback(() => {
    if (!pipelineResult) return;

    setScanContext(pipelineResult.result, pipelineResult.llmContext);
    setSavedForStudy(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [pipelineResult, setScanContext]);

  const reset = useCallback(() => {
    setScanState("idle");
    setPipelineResult(null);
    setErrorMessage(null);
    setSavedForStudy(false);
  }, []);

  return {
    scanState,
    pipelineResult,
    errorMessage,
    savedForStudy,
    captureFromCamera,
    processImage,
    pickFromGallery,
    saveForStudy,
    reset,
  };
}
