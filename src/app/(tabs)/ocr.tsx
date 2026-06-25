import { CameraView } from "expo-camera";
import { useRef } from "react";

import { OcrCaptureView } from "../../components/ocr/OcrCaptureView";
import { useOcrWorkflow } from "../../hooks/useOcrWorkflow";

export default function OcrScreen() {
  const cameraRef = useRef<CameraView>(null);
  const {
    scanState,
    pipelineResult,
    errorMessage,
    savedForStudy,
    captureFromCamera,
    pickFromGallery,
    saveForStudy,
    reset,
  } = useOcrWorkflow();

  return (
    <OcrCaptureView
      cameraRef={cameraRef}
      scanState={scanState}
      pipelineResult={pipelineResult}
      errorMessage={errorMessage}
      savedForStudy={savedForStudy}
      onCapture={() => captureFromCamera(cameraRef)}
      onPickGallery={pickFromGallery}
      onSaveForStudy={saveForStudy}
      onReset={reset}
    />
  );
}
