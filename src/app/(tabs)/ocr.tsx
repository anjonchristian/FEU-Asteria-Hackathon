import { CameraView } from "expo-camera";
import { useRef } from "react";
import { Modal, StyleSheet, View } from "react-native";
import CropView from "../../components/CropView";
import { OcrCaptureView } from "../../components/ocr/OcrCaptureView";
import { Colors } from "../../constants/theme";
import { useOcrWorkflow } from "../../hooks/useOcrWorkflow";

export default function OcrScreen() {
  const cameraRef = useRef<CameraView | null>(null);

  const {
    scanState,
    pipelineResult,
    errorMessage,
    savedForStudy,
    isGeneratingQuiz,
    pendingPhoto,
    captureFromCamera,
    cancelCrop,
    onCropComplete,
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

      <Modal
        visible={!!pendingPhoto}
        animationType="slide"
        transparent={false}
        onRequestClose={cancelCrop}
      >
        {/* <SafeAreaProvider> */}
        <View style={styles.modalFill}>
          {pendingPhoto && (
            <CropView
              imageUri={pendingPhoto.uri}
              imageWidth={pendingPhoto.width}
              imageHeight={pendingPhoto.height}
              onCropComplete={onCropComplete}
              onCancel={cancelCrop}
            />
          )}
        </View>
        {/* </SafeAreaProvider> */}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalFill: {
    flex: 1,
    backgroundColor: "#000",
  },
});
