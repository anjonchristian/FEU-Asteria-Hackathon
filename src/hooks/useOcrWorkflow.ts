import type { CameraView } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useMemo, useState, type RefObject } from "react";
import { getOcrErrorMessage } from "../constants/ocrStrings";
import {
  runOcrPipeline,
  type OcrError,
  type OcrErrorCode,
  type OcrPipelineResult,
} from "../services/ocr";
import { generateQuizFromText } from "../services/sml/quizGenerator";
import { useOcrContextStore } from "../store/ocrContext";
import { useProfile } from "../store/profile";
import { useVaultStore } from "../store/vault";

export type OcrScanState = "idle" | "processing" | "result" | "error";

export type PendingPhoto = {
  uri: string;
  width: number;
  height: number;
};

export function useOcrWorkflow() {
  const { language, name, grade, subjects } = useProfile();
  const setScanContext = useOcrContextStore((s) => s.setScanContext);
  const { addDeck } = useVaultStore();

  const [scanState, setScanState] = useState<OcrScanState>("idle");
  const [pipelineResult, setPipelineResult] =
    useState<OcrPipelineResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedForStudy, setSavedForStudy] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Holds the raw photo URI waiting for crop confirmation
  const [pendingPhoto, setPendingPhoto] = useState<PendingPhoto | null>(null);

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
      setErrorMessage(getOcrErrorMessage(language, code as OcrErrorCode));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    [language],
  );

  // Runs OCR on a URI — called after crop is confirmed
  const processImage = useCallback(
    async (uri: string, source: "camera" | "gallery") => {
      setScanState("processing");
      setPipelineResult(null);
      setErrorMessage(null);
      setSavedForStudy(false);
      setPendingPhoto(null);

      try {
        const result = await runOcrPipeline(uri, source, profileContext);
        setPipelineResult(result);
        setScanState("result");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        handleOcrError(error);
      }
    },
    [handleOcrError, profileContext],
  );

  // Takes a photo and stores it as pendingPhoto — crop happens next
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

        setPendingPhoto({
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
        });
      } catch (error) {
        handleOcrError(error);
      }
    },
    [handleOcrError],
  );

  // Called when user cancels the crop screen
  const cancelCrop = useCallback(() => {
    setPendingPhoto(null);
  }, []);

  // Called when CropView confirms — receives the cropped URI
  const onCropComplete = useCallback(
    (croppedUri: string) => {
      processImage(croppedUri, "camera");
    },
    [processImage],
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

    // Gallery images skip crop and go straight to OCR
    await processImage(picked.assets[0].uri, "gallery");
  }, [handleOcrError, processImage]);

  const saveForStudy = useCallback(() => {
    if (!pipelineResult) return;
    setScanContext(pipelineResult.result, pipelineResult.llmContext);
    setSavedForStudy(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/study-session" as any);
  }, [pipelineResult, setScanContext]);

  const generateQuiz = useCallback(async () => {
    if (!pipelineResult) return;

    setIsGeneratingQuiz(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const deck = await generateQuizFromText(
        null,
        pipelineResult.result.cleanedText,
        subjects.length > 0 ? subjects[0] : "general",
        5,
      );
      addDeck(deck);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/study-vault" as any);
    } catch (error) {
      console.error("[generateQuiz] Failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Quiz generation failed. Try scanning shorter text.",
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsGeneratingQuiz(false);
    }
  }, [pipelineResult, addDeck, subjects]);

  const reset = useCallback(() => {
    setScanState("idle");
    setPipelineResult(null);
    setErrorMessage(null);
    setSavedForStudy(false);
    setIsGeneratingQuiz(false);
    setPendingPhoto(null);
  }, []);

  return {
    scanState,
    pipelineResult,
    errorMessage,
    savedForStudy,
    isGeneratingQuiz,
    pendingPhoto,
    captureFromCamera,
    cancelCrop,
    onCropComplete,
    processImage,
    pickFromGallery,
    saveForStudy,
    generateQuiz,
    reset,
  };
}
