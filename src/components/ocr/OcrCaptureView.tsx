import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, type RefObject } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { getOcrStrings } from "../../constants/ocrStrings";
import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";
import type { OcrScanState } from "../../hooks/useOcrWorkflow";
import type { OcrPipelineResult } from "../../services/ocr/types";
import { useProfile } from "../../store/profile";

interface OcrCaptureViewProps {
  cameraRef: RefObject<CameraView | null>;
  scanState: OcrScanState;
  pipelineResult: OcrPipelineResult | null;
  errorMessage: string | null;
  savedForStudy: boolean;
  isGeneratingQuiz: boolean;
  onCapture: () => void;
  onPickGallery: () => void;
  onSaveForStudy: () => void;
  onGenerateQuiz: () => void;
  onReset: () => void;
  onClose?: () => void;
  onTextCaptured?: (text: string) => void;
}

export function OcrCaptureView({
  cameraRef,
  scanState,
  pipelineResult,
  errorMessage,
  savedForStudy,
  isGeneratingQuiz,
  onCapture,
  onPickGallery,
  onSaveForStudy,
  onGenerateQuiz,
  onReset,
  onClose,
  onTextCaptured,
}: OcrCaptureViewProps) {
  const { language } = useProfile();
  const strings = getOcrStrings(language);
  const [permission, requestPermission] = useCameraPermissions();
  const insets = useSafeAreaInsets();

  const scanY = useSharedValue(0);
  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
  }));

  useEffect(() => {
    if (scanState === "processing") {
      scanY.value = withRepeat(
        withTiming(280, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      scanY.value = 0;
    }
  }, [scanState, scanY]);

  // Auto-capture text if in straight text-capture mode
  useEffect(() => {
    if (
      onTextCaptured &&
      scanState === "result" &&
      pipelineResult?.result.cleanedText
    ) {
      onTextCaptured(pipelineResult.result.cleanedText);
    }
  }, [scanState, pipelineResult, onTextCaptured]);

  if (!permission) return <View style={styles.safe} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={Colors.teal} />
          <Text style={styles.permissionTitle}>{strings.permissionTitle}</Text>
          <Text style={styles.permissionSub}>{strings.permissionBody}</Text>
          <Pressable onPress={requestPermission} style={styles.permBtn}>
            <Text style={styles.permBtnText}>{strings.permissionButton}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isBusy = scanState === "processing";
  // Hide the result overlay entirely if we are using onTextCaptured (it auto-closes instead)
  const showResult =
    scanState === "result" && pipelineResult && !onTextCaptured;
  const showError = scanState === "error" && errorMessage;

  return (
    <SafeAreaView style={styles.safe}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      />
      <View style={styles.overlay}>
        <View style={styles.header}>
          {onClose && (
            <Pressable onPress={onClose} style={styles.headerSpacer}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
          )}
          <Text style={styles.headerTitle}>{strings.screenTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.viewfinderArea}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {isBusy && <Animated.View style={[styles.scanLine, scanStyle]} />}

            {/* Dedicated SLM Generation Overlay */}
            {isGeneratingQuiz && (
              <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                style={styles.generatingOverlay}
              >
                <ActivityIndicator size="large" color={Colors.teal} />
                <Text style={styles.generatingTitle}>
                  Crafting your quiz...
                </Text>
                <Text style={styles.generatingSub}>
                  Teacher Kahayag is analyzing the text to create your
                  flashcards.
                </Text>
              </Animated.View>
            )}

            {isBusy && !isGeneratingQuiz && (
              <Animated.View entering={FadeIn} style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={Colors.yellow} />
                <Text style={styles.processingTitle}>
                  {strings.loadingTitle}
                </Text>
                <Text style={styles.processingSub}>
                  {strings.loadingSubtitle}
                </Text>
              </Animated.View>
            )}

            {showResult && !isGeneratingQuiz && (
              <Animated.View entering={FadeIn} style={styles.resultOverlay}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.resultTag}>{strings.resultTag}</Text>
                  <Text style={styles.resultDetected}>
                    {pipelineResult.result.cleanedText}
                  </Text>
                  <Text style={styles.resultMeta}>
                    {pipelineResult.result.lineCount} lines •{" "}
                    {pipelineResult.result.blockCount} blocks
                  </Text>

                  <View style={styles.actionGroup}>
                    {savedForStudy ? (
                      <View style={styles.savedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={Colors.yellow}
                        />
                        <Text style={styles.savedText}>
                          {language === "fil"
                            ? "Naka-save na para sa AI tutor!"
                            : "Saved for the AI tutor!"}
                        </Text>
                      </View>
                    ) : (
                      <Pressable
                        onPress={onSaveForStudy}
                        style={({ pressed }) => [
                          styles.studyBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Ionicons
                          name="chatbubbles-outline"
                          size={18}
                          color="#fff"
                        />
                        <Text style={styles.studyBtnText}>Chat with Tutor</Text>
                      </Pressable>
                    )}

                    <Pressable
                      onPress={onGenerateQuiz}
                      style={({ pressed }) => [
                        styles.studyBtn,
                        { backgroundColor: Colors.teal },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons name="albums-outline" size={18} color="#fff" />
                      <Text style={styles.studyBtnText}>
                        Generate Quiz Deck
                      </Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </Animated.View>
            )}

            {showError && !isGeneratingQuiz && (
              <Animated.View entering={FadeIn} style={styles.errorOverlay}>
                <Ionicons
                  name="alert-circle-outline"
                  size={40}
                  color={Colors.yellow}
                />
                <Text style={styles.errorTitle}>
                  {language === "fil" ? "Oops!" : "Oops!"}
                </Text>
                <Text style={styles.errorBody}>{errorMessage}</Text>
                <Text style={styles.errorTip}>{strings.tipHoldSteady}</Text>
              </Animated.View>
            )}

            {scanState === "idle" && !isGeneratingQuiz && (
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
                <Text style={styles.idleText}>{strings.idleHint}</Text>
                <Text style={styles.idleTip}>{strings.tipGoodLight}</Text>
              </Animated.View>
            )}
          </View>
        </View>

        {!isGeneratingQuiz && (
          <View
            style={[
              styles.controls,
              { paddingBottom: Math.max(insets.bottom + 12, 32) },
            ]}
          >
            <Text style={styles.statusText}>
              {scanState === "idle" && strings.statusIdle}
              {scanState === "processing" && strings.statusProcessing}
              {scanState === "result" && strings.statusResult}
              {scanState === "error" && strings.tipGoodLight}
            </Text>
            <View style={styles.btnRow}>
              {scanState === "result" || scanState === "error" ? (
                <Pressable
                  onPress={onReset}
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
                  <Text style={styles.resetText}>{strings.scanAgain}</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    onPress={onPickGallery}
                    disabled={isBusy}
                    style={({ pressed }) => [
                      styles.galleryBtn,
                      pressed && styles.pressed,
                      isBusy && styles.disabled,
                    ]}
                  >
                    <Ionicons
                      name="images-outline"
                      size={22}
                      color={Colors.teal}
                    />
                    <Text style={styles.galleryText}>
                      {strings.galleryButton}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={onCapture}
                    disabled={isBusy}
                    style={({ pressed }) => [
                      styles.scanBtn,
                      pressed && styles.pressed,
                      isBusy && styles.scanBtnScanning,
                    ]}
                  >
                    <View style={styles.scanBtnInner}>
                      <Ionicons
                        name={isBusy ? "scan-outline" : "camera"}
                        size={30}
                        color="#fff"
                      />
                    </View>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
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
  generatingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(12, 31, 22, 0.98)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    zIndex: 10,
  },
  generatingTitle: {
    fontSize: FontSize.lg,
    fontWeight: "900",
    color: "#fff",
    marginTop: Spacing.md,
    textAlign: "center",
  },
  generatingSub: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(28,56,41,0.92)",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  processingTitle: {
    fontSize: FontSize.lg,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
  },
  processingSub: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
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
    fontSize: FontSize.md,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 22,
    marginBottom: 8,
  },
  resultMeta: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    marginBottom: Spacing.md,
  },
  actionGroup: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  studyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  studyBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: FontSize.sm,
  },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 10,
    borderRadius: Radius.md,
  },
  savedText: {
    flex: 1,
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.green,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(40,20,20,0.94)",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  errorTitle: {
    fontSize: FontSize.lg,
    fontWeight: "900",
    color: "#fff",
  },
  errorBody: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 20,
  },
  errorTip: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.teal,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  idleHint: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
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
    color: "rgba(255,255,255,0.5)",
    fontSize: FontSize.sm,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  idleTip: {
    color: "rgba(255,255,255,0.35)",
    fontSize: FontSize.xs,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  controls: {
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    gap: Spacing.md,
  },
  statusText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: FontSize.sm,
    fontWeight: "600",
    textAlign: "center",
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  galleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(74,167,124,0.15)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.teal,
  },
  galleryText: {
    color: Colors.teal,
    fontWeight: "800",
    fontSize: FontSize.sm,
  },
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
  scanBtnScanning: {
    backgroundColor: "#1C3829",
    borderColor: Colors.teal,
  },
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
  disabled: { opacity: 0.5 },
});
