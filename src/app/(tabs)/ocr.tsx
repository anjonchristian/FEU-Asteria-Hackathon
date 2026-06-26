import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CameraWithCrop from "../../components/CameraWithCrop";
import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";
import { useOcrWorkflow } from "../../hooks/useOcrWorkflow";

export default function OcrScreen() {
  const { scanState, errorMessage, processImage, reset } = useOcrWorkflow();

  if (scanState === "processing") {
    return (
      <SafeAreaView style={styles.stateScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.stateTitle}>Nagbabasa ang AI...</Text>
        <Text style={styles.stateBody}>
          Offline OCR ito. Sandali lang habang hinahanap ang mga salita sa crop.
        </Text>
      </SafeAreaView>
    );
  }

  if (scanState === "error") {
    return (
      <SafeAreaView style={styles.stateScreen}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.primary} />
        <Text style={styles.stateTitle}>Subukan ulit</Text>
        <Text style={styles.stateBody}>
          {errorMessage || "Hindi mabasa ang larawan ngayon."}
        </Text>
        <Pressable onPress={reset} style={styles.retryButton}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.retryText}>Mag-scan Ulit</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <CameraWithCrop
      onCropComplete={(croppedImageUri) => {
        processImage(croppedImageUri, "camera");
      }}
      onCancel={() => router.replace("/(tabs)" as any)}
    />
  );
}

const styles = StyleSheet.create({
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
