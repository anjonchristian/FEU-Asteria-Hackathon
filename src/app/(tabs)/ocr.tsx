import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";

type ScanState = "idle" | "scanning" | "result";

// Simulated OCR result — replace with real ML Kit / AWS Textract integration
const MOCK_RESULT = {
  detected: "5 × 8 = ?",
  explanation: "This is a multiplication problem.\n5 groups of 8 = 40 ✓",
  tip: "Try: 6 × 8 = ? in your Math module!",
};

export default function OcrScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<typeof MOCK_RESULT | null>(null);

  // Scan line animation
  const scanY = useSharedValue(0);
  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
  }));

  useEffect(() => {
    if (scanState === "scanning") {
      scanY.value = withRepeat(
        withTiming(280, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      scanY.value = 0;
    }
  }, [scanState]);

  const startScan = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanState("scanning");
    setResult(null);

    // Simulate network / ML processing delay
    setTimeout(() => {
      setScanState("result");
      setResult(MOCK_RESULT);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2800);
  };

  const reset = () => {
    setScanState("idle");
    setResult(null);
  };

  // Permission gate
  if (!permission) return <View style={styles.safe} />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={Colors.teal} />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionSub}>
            Kahayag needs your camera to scan text and problems.
          </Text>
          <Pressable onPress={requestPermission} style={styles.permBtn}>
            <Text style={styles.permBtnText}>Allow Camera</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safe}>
      {/* Camera background */}
      <CameraView style={StyleSheet.absoluteFill} facing="back" />

      {/* Dark overlay outside frame */}
      <View style={styles.overlay}>
        {/* Header */}
        <SafeAreaView>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerTitle}>Scan & Learn</Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>

        {/* Viewfinder */}
        <View style={styles.viewfinderArea}>
          <View style={styles.viewfinder}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Scan line */}
            {scanState === "scanning" && (
              <Animated.View style={[styles.scanLine, scanStyle]} />
            )}

            {/* Result overlay */}
            {scanState === "result" && result && (
              <Animated.View entering={FadeIn} style={styles.resultOverlay}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.resultTag}>✓ Text Detected</Text>
                  <Text style={styles.resultDetected}>{result.detected}</Text>
                  <Text style={styles.resultExplanation}>
                    {result.explanation}
                  </Text>
                  <View style={styles.tipBox}>
                    <Ionicons
                      name="bulb-outline"
                      size={16}
                      color={Colors.yellow}
                    />
                    <Text style={styles.tipText}>{result.tip}</Text>
                  </View>
                </ScrollView>
              </Animated.View>
            )}

            {/* Idle hint */}
            {scanState === "idle" && (
              <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                style={styles.idleHint}
              >
                <View style={styles.cameraIconBox}>
                  <Ionicons
                    name="camera-outline"
                    size={32}
                    color={Colors.teal}
                  />
                </View>
                <Text style={styles.idleText}>
                  Point at any text, problem, or worksheet
                </Text>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Bottom controls */}
        <View style={styles.controls}>
          <Text style={styles.statusText}>
            {scanState === "idle" && "Tap the button to start scanning"}
            {scanState === "scanning" && "Scanning for text..."}
            {scanState === "result" && "Tap scan to try again"}
          </Text>

          <View style={styles.btnRow}>
            {scanState === "result" ? (
              <Pressable
                onPress={reset}
                style={({ pressed }) => [
                  styles.resetBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="refresh-outline"
                  size={22}
                  color={Colors.teal}
                />
                <Text style={styles.resetText}>Scan Again</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={startScan}
                disabled={scanState === "scanning"}
                style={({ pressed }) => [
                  styles.scanBtn,
                  pressed && styles.pressed,
                  scanState === "scanning" && styles.scanBtnScanning,
                ]}
              >
                <View style={styles.scanBtnInner}>
                  <Ionicons
                    name={scanState === "scanning" ? "scan-outline" : "camera"}
                    size={30}
                    color="#fff"
                  />
                </View>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const VIEWFINDER_SIZE = 300;
const CORNER = 28;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0C1F16" },

  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  permissionTitle: {
    fontSize: FontSize.xl,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
  },
  permissionSub: {
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 20,
  },
  permBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
  },
  permBtnText: { color: "#fff", fontWeight: "800", fontSize: FontSize.md },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: { color: "#fff", fontWeight: "900", fontSize: FontSize.md },
  headerSpacer: { width: 40 },

  viewfinderArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE + 80,
    borderRadius: Radius.xl,
    overflow: "hidden",
    backgroundColor: "rgba(15,42,30,0.4)",
  },

  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: Colors.teal,
  },
  cornerTL: {
    top: 12,
    left: 12,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 12,
    right: 12,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 12,
    left: 12,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 12,
    right: 12,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 8,
  },

  scanLine: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.yellow,
    shadowColor: Colors.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },

  resultOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(28,56,41,0.96)",
    padding: Spacing.md,
    borderRadius: Radius.xl,
  },
  resultTag: {
    fontSize: FontSize.sm,
    fontWeight: "900",
    color: Colors.yellow,
    marginBottom: 8,
  },
  resultDetected: {
    fontSize: FontSize.xl,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
  },
  resultExplanation: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
    marginBottom: 12,
  },
  tipBox: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 10,
    borderRadius: Radius.md,
  },
  tipText: {
    flex: 1,
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.green,
    lineHeight: 17,
  },

  idleHint: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  cameraIconBox: {
    width: 64,
    height: 64,
    borderRadius: Radius.xl,
    backgroundColor: "rgba(74,167,124,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  idleText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: FontSize.sm,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },

  controls: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 32,
    alignItems: "center",
    gap: Spacing.md,
  },
  statusText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: FontSize.sm,
    fontWeight: "600",
    textAlign: "center",
  },
  btnRow: { alignItems: "center" },
  scanBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  scanBtnScanning: { backgroundColor: "#1C3829", borderColor: Colors.teal },
  scanBtnInner: { alignItems: "center", justifyContent: "center" },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(74,167,124,0.15)",
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.teal,
  },
  resetText: { color: Colors.teal, fontWeight: "800", fontSize: FontSize.md },
  pressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
});
