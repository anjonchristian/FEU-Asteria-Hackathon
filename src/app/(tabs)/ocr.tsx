import { CameraView } from "expo-camera";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import { OcrCaptureView } from "../../components/ocr/OcrCaptureView";
import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";
import { useOcrWorkflow } from "../../hooks/useOcrWorkflow";

export default function OcrScreen() {
  const cameraRef = useRef<CameraView | null>(null);

  const {
    scanState,
    pipelineResult,
    errorMessage,
    savedForStudy,
    isGeneratingQuiz,
    captureFromCamera,
    pickFromGallery,
    saveForStudy,
    generateQuiz,
    reset,
  } = useOcrWorkflow();

  return (
    <View style={styles.container}>
      <OcrCaptureView
        cameraRef={cameraRef}
        scanState={scanState}
        pipelineResult={pipelineResult}
        errorMessage={errorMessage}
        savedForStudy={savedForStudy}
        isGeneratingQuiz={isGeneratingQuiz}
        onCapture={() => captureFromCamera(cameraRef)}
        onPickGallery={pickFromGallery}
        onSaveForStudy={saveForStudy}
        onGenerateQuiz={generateQuiz}
        onReset={reset}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  stateScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  stateTitle: {
    color: Colors.forest,
    fontSize: FontSize.xl,
    fontWeight: "900",
    textAlign: "center",
  },
  stateBody: {
    color: Colors.mutedText,
    fontSize: FontSize.md,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  retryText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "900",
  },
});
