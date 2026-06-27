import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { Colors, FontSize, Radius, Spacing } from "../constants/theme";

interface CameraWithCropProps {
  onCropComplete: (croppedImageUri: string) => void;
  onCancel: () => void;
}

type CapturePhase = "camera" | "crop";

type CapturedImage = {
  uri: string;
  width: number;
  height: number;
};

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type HandleName = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

type ImageFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
};

// Guide box aspect ratio (portrait page)
const GUIDE_RATIO = 0.68;
const GUIDE_WIDTH_RATIO = 0.82;
const MIN_CROP_SIZE_PX = 80;

// How much space the crop footer takes up (buttons + padding)
const CROP_FOOTER_HEIGHT = 80;
// How much space the crop header takes up
const CROP_HEADER_HEIGHT = 110;

export default function CameraWithCrop({
  onCropComplete,
  onCancel,
}: CameraWithCropProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const flashOpacity = useRef(new Animated.Value(0)).current;

  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<CapturePhase>("camera");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(
    null,
  );
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const dragStartRect = useRef<CropRect | null>(null);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // ─── Camera phase: guide box ────────────────────────────────────────────────
  // Top bar: insets.top + ~56px for badge+cancel row
  // Bottom dock: insets.bottom + capture button area ~140px
  const cameraGuide = useMemo(() => {
    const topReserve = insets.top + 64;
    const bottomReserve = insets.bottom + 148;
    const available = Math.max(0, screenHeight - topReserve - bottomReserve);

    const maxW = screenWidth * GUIDE_WIDTH_RATIO;
    const maxWFromH = available / (1 / GUIDE_RATIO);
    const guideWidth = Math.min(maxW, maxWFromH);
    const guideHeight = guideWidth / GUIDE_RATIO;
    const guideLeft = (screenWidth - guideWidth) / 2;
    const guideTop = topReserve + (available - guideHeight) / 2;

    return {
      left: guideLeft,
      top: Math.max(topReserve, guideTop),
      width: guideWidth,
      height: guideHeight,
    };
  }, [insets.bottom, insets.top, screenHeight, screenWidth]);

  // ─── Crop phase: image layout ────────────────────────────────────────────────
  const imageFrame = useMemo<ImageFrame | null>(() => {
    if (!capturedImage) return null;
    const imgAspect = capturedImage.width / capturedImage.height;
    const scrAspect = screenWidth / screenHeight;
    let w = screenWidth,
      h = screenHeight,
      x = 0,
      y = 0;
    if (imgAspect > scrAspect) {
      w = screenWidth;
      h = w / imgAspect;
      y = (screenHeight - h) / 2;
    } else {
      h = screenHeight;
      w = h * imgAspect;
      x = (screenWidth - w) / 2;
    }
    return { x, y, width: w, height: h, scale: w / capturedImage.width };
  }, [capturedImage, screenHeight, screenWidth]);

  // ─── Initial crop rect ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!capturedImage || !imageFrame) return;

    // Safe vertical zone within the image frame, avoiding header and footer
    const headerBottom = insets.top + CROP_HEADER_HEIGHT;
    const footerTop = screenHeight - (insets.bottom + CROP_FOOTER_HEIGHT);

    const safeTop = Math.max(0, headerBottom - imageFrame.y);
    const safeBottom = Math.min(imageFrame.height, footerTop - imageFrame.y);
    const usableH = Math.max(100, safeBottom - safeTop);

    const initW = Math.min(imageFrame.width * 0.8, usableH * GUIDE_RATIO);
    const initH = Math.min(initW / GUIDE_RATIO, usableH);
    const left = (imageFrame.width - initW) / 2;
    const top = safeTop + (usableH - initH) / 2;

    setCropRect({ x: left, y: top, width: initW, height: initH });
  }, [capturedImage, imageFrame, insets.bottom, insets.top, screenHeight]);

  const cropRectRef = useRef<CropRect | null>(null);
  useEffect(() => {
    cropRectRef.current = cropRect;
  }, [cropRect]);

  // Max Y the bottom handles can reach (stay above the footer)
  const maxCropBottom = useMemo(() => {
    if (!imageFrame) return 0;
    const footerTop = screenHeight - (insets.bottom + CROP_FOOTER_HEIGHT);
    return footerTop - imageFrame.y;
  }, [imageFrame, insets.bottom, screenHeight]);

  // ─── Pan responders ──────────────────────────────────────────────────────────
  const buildResponder = (handle: HandleName) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartRect.current = cropRectRef.current;
      },
      onPanResponderMove: (_, g) => {
        if (!imageFrame) return;
        const cur = dragStartRect.current;
        if (!cur) return;
        const minSize = Math.max(MIN_CROP_SIZE_PX * imageFrame.scale, 48);
        const safeBottom = Math.min(imageFrame.height, maxCropBottom);
        let { x: l, y: t, width, height } = cur;
        let r = l + width,
          b = t + height;

        if (handle === "topLeft") {
          l = clamp(l + g.dx, 0, r - minSize);
          t = clamp(t + g.dy, 0, b - minSize);
        } else if (handle === "topRight") {
          r = clamp(r + g.dx, l + minSize, imageFrame.width);
          t = clamp(t + g.dy, 0, b - minSize);
        } else if (handle === "bottomLeft") {
          l = clamp(l + g.dx, 0, r - minSize);
          b = clamp(b + g.dy, t + minSize, safeBottom);
        } else if (handle === "bottomRight") {
          r = clamp(r + g.dx, l + minSize, imageFrame.width);
          b = clamp(b + g.dy, t + minSize, safeBottom);
        }

        setCropRect({
          x: l,
          y: t,
          width: Math.max(minSize, r - l),
          height: Math.max(minSize, b - t),
        });
      },
      onPanResponderRelease: () => {
        dragStartRect.current = null;
      },
      onPanResponderTerminate: () => {
        dragStartRect.current = null;
      },
    });

  const handleResponders = useMemo(
    () => ({
      topLeft: buildResponder("topLeft"),
      topRight: buildResponder("topRight"),
      bottomLeft: buildResponder("bottomLeft"),
      bottomRight: buildResponder("bottomRight"),
    }),
    [imageFrame, maxCropBottom],
  );

  // ─── Permission screen ───────────────────────────────────────────────────────
  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permRoot}>
        <View style={styles.permCard}>
          <Ionicons name="camera-outline" size={52} color={Colors.primary} />
          <Text style={styles.permTitle}>Kailangan ang camera</Text>
          <Text style={styles.permBody}>
            Ibigay ang permission para makapag-scan ng textbook pages offline.
          </Text>
          <Pressable onPress={requestPermission} style={styles.permBtn}>
            <Text style={styles.permBtnText}>Payagan ang Camera</Text>
          </Pressable>
          <Pressable onPress={onCancel} style={styles.permLink}>
            <Text style={styles.permLinkText}>Bumalik</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Crop overlay in screen space ───────────────────────────────────────────
  const cropOverlay =
    cropRect && imageFrame
      ? {
          left: imageFrame.x + cropRect.x,
          top: imageFrame.y + cropRect.y,
          width: cropRect.width,
          height: cropRect.height,
        }
      : null;

  // ─── Capture ─────────────────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);
    Animated.sequence([
      Animated.timing(flashOpacity, {
        toValue: 0.85,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start();
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      setCapturedImage({ uri: pic.uri, width: pic.width, height: pic.height });
      setPhase("crop");
    } catch (e) {
      console.error("[CameraWithCrop] capture:", e);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCropRect(null);
    setPhase("camera");
  };

  const handleConfirmCrop = async () => {
    if (!capturedImage || !imageFrame || !cropRect || isConfirming) return;
    setIsConfirming(true);
    try {
      const originX = clamp(
        Math.round(cropRect.x / imageFrame.scale),
        0,
        capturedImage.width - 1,
      );
      const originY = clamp(
        Math.round(cropRect.y / imageFrame.scale),
        0,
        capturedImage.height - 1,
      );
      const width = clamp(
        Math.round(cropRect.width / imageFrame.scale),
        1,
        capturedImage.width - originX,
      );
      const height = clamp(
        Math.round(cropRect.height / imageFrame.scale),
        1,
        capturedImage.height - originY,
      );
      const result = await ImageManipulator.manipulate(capturedImage.uri)
        .crop({ originX, originY, width, height })
        .renderAsync();
      const saved = await result.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.95,
      });
      onCropComplete(saved.uri);
    } catch (e) {
      console.error("[CameraWithCrop] crop:", e);
    } finally {
      setIsConfirming(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── CAMERA PHASE ── */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        active={phase === "camera"}
        facing="back"
        mode="picture"
        onCameraReady={() => setIsCameraReady(true)}
      />

      {phase === "camera" && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Dark overlay around guide */}
          <View
            style={[
              styles.dim,
              { top: 0, left: 0, right: 0, height: cameraGuide.top },
            ]}
          />
          <View
            style={[
              styles.dim,
              {
                top: cameraGuide.top,
                left: 0,
                width: cameraGuide.left,
                height: cameraGuide.height,
              },
            ]}
          />
          <View
            style={[
              styles.dim,
              {
                top: cameraGuide.top,
                left: cameraGuide.left + cameraGuide.width,
                right: 0,
                height: cameraGuide.height,
              },
            ]}
          />
          <View
            style={[
              styles.dim,
              {
                top: cameraGuide.top + cameraGuide.height,
                left: 0,
                right: 0,
                bottom: 0,
              },
            ]}
          />

          {/* Guide frame corners */}
          <View
            style={[
              styles.guideFrame,
              {
                left: cameraGuide.left,
                top: cameraGuide.top,
                width: cameraGuide.width,
                height: cameraGuide.height,
              },
            ]}
          >
            <View style={[styles.bracket, styles.bTLH]} />
            <View style={[styles.bracket, styles.bTLV]} />
            <View style={[styles.bracket, styles.bTRH]} />
            <View style={[styles.bracket, styles.bTRV]} />
            <View style={[styles.bracket, styles.bBLH]} />
            <View style={[styles.bracket, styles.bBLV]} />
            <View style={[styles.bracket, styles.bBRH]} />
            <View style={[styles.bracket, styles.bBRV]} />
          </View>

          {/* Top bar: offline badge + cancel */}
          <SafeAreaView style={styles.cameraTopBar} pointerEvents="box-none">
            <View style={styles.cameraTopRow}>
              <View style={styles.offlineBadge}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={13}
                  color={Colors.primary}
                />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
              <Pressable onPress={onCancel} style={styles.cancelBtn}>
                <Ionicons name="close" size={18} color="#fff" />
                <Text style={styles.cancelText}>Lumabas</Text>
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Bottom dock: hint + gallery/capture */}
          <View
            style={[
              styles.captureDock,
              { paddingBottom: Math.max(insets.bottom + 16, 28) },
            ]}
          >
            <Text style={styles.cameraHint}>
              I-pwesto ang libro sa loob ng guide
            </Text>
            <View style={styles.captureRow}>
              {/* Spacer so capture button stays centered */}
              <View style={styles.captureRowSide} />

              <Pressable
                onPress={handleCapture}
                disabled={!isCameraReady || isCapturing}
                style={({ pressed }) => [
                  styles.captureBtn,
                  (!isCameraReady || isCapturing) && styles.captureBtnDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.captureInner} />
              </Pressable>

              {/* Right side stays empty to keep capture centered */}
              <View style={styles.captureRowSide} />
            </View>
            <Text style={styles.captureSubHint}>
              {isCameraReady
                ? "Pindutin para mag-scan"
                : "Naghahanda ang camera..."}
            </Text>
          </View>
        </View>
      )}

      {/* ── CROP PHASE ── */}
      {phase === "crop" && capturedImage && imageFrame && cropOverlay && (
        <View style={styles.cropStage}>
          {/* Full image */}
          <Image
            source={{ uri: capturedImage.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />

          {/* Dark overlay: 4 quadrants around crop box */}
          <View
            style={[
              styles.cropShade,
              { top: 0, left: 0, right: 0, height: cropOverlay.top },
            ]}
          />
          <View
            style={[
              styles.cropShade,
              {
                top: cropOverlay.top,
                left: 0,
                width: cropOverlay.left,
                height: cropOverlay.height,
              },
            ]}
          />
          <View
            style={[
              styles.cropShade,
              {
                top: cropOverlay.top,
                left: cropOverlay.left + cropOverlay.width,
                right: 0,
                height: cropOverlay.height,
              },
            ]}
          />
          <View
            style={[
              styles.cropShade,
              {
                left: 0,
                right: 0,
                top: cropOverlay.top + cropOverlay.height,
                bottom: 0,
              },
            ]}
          />

          {/* Crop box border + handles */}
          <View
            style={[
              styles.cropBox,
              {
                left: cropOverlay.left,
                top: cropOverlay.top,
                width: cropOverlay.width,
                height: cropOverlay.height,
              },
            ]}
          >
            {/* Grid lines */}
            <View style={styles.gridH1} />
            <View style={styles.gridH2} />
            <View style={styles.gridV1} />
            <View style={styles.gridV2} />

            {/* Corner handles */}
            <View
              {...handleResponders.topLeft.panHandlers}
              style={[styles.handle, styles.handleTL]}
            />
            <View
              {...handleResponders.topRight.panHandlers}
              style={[styles.handle, styles.handleTR]}
            />
            <View
              {...handleResponders.bottomLeft.panHandlers}
              style={[styles.handle, styles.handleBL]}
            />
            <View
              {...handleResponders.bottomRight.panHandlers}
              style={[styles.handle, styles.handleBR]}
            />
          </View>

          {/* ── Crop header (pinned to top, does not scroll with image) ── */}
          <View style={[styles.cropHeader, { paddingTop: insets.top + 12 }]}>
            <View style={styles.cropHeaderRow}>
              <View style={styles.offlineBadge}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={13}
                  color={Colors.primary}
                />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
              <Pressable onPress={onCancel} style={styles.cancelBtn}>
                <Ionicons name="close" size={18} color="#fff" />
                <Text style={styles.cancelText}>Lumabas</Text>
              </Pressable>
            </View>
            <Text style={styles.cropTitle}>I-adjust ang crop</Text>
            <Text style={styles.cropSubtitle}>
              Hilain ang mga sulok para tumugma sa page
            </Text>
          </View>

          {/* ── Crop footer (pinned to bottom, always above handles) ── */}
          <View
            style={[
              styles.cropFooter,
              { paddingBottom: Math.max(insets.bottom + 16, 24) },
            ]}
          >
            <Pressable
              onPress={handleRetake}
              style={({ pressed }) => [
                styles.retakeBtn,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="refresh" size={18} color={Colors.primary} />
              <Text style={styles.retakeText}>Ulitin</Text>
            </Pressable>

            <Pressable
              onPress={handleConfirmCrop}
              disabled={isConfirming}
              style={({ pressed }) => [
                styles.confirmBtn,
                isConfirming && styles.confirmDisabled,
                pressed && styles.pressed,
              ]}
            >
              {isConfirming ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmText}>Kumpirma</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {/* Flash on capture */}
      <Animated.View
        pointerEvents="none"
        style={[styles.flash, { opacity: flashOpacity }]}
      />
    </View>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

const BRACKET_LEN = 26;
const BRACKET_W = 3;
const HANDLE_SIZE = 24;
const HANDLE_HIT = 44; // larger hit target than visual

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#04110B" },
  flash: { ...StyleSheet.absoluteFill, backgroundColor: "#fff" },

  // ── Dim overlay blocks ──
  dim: { position: "absolute", backgroundColor: "rgba(0,0,0,0.52)" },

  // ── Camera guide frame ──
  guideFrame: {
    position: "absolute",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  bracket: { position: "absolute", backgroundColor: "#fff" },
  bTLH: {
    top: 0,
    left: 0,
    width: BRACKET_LEN,
    height: BRACKET_W,
    borderTopLeftRadius: 2,
  },
  bTLV: {
    top: 0,
    left: 0,
    width: BRACKET_W,
    height: BRACKET_LEN,
    borderTopLeftRadius: 2,
  },
  bTRH: {
    top: 0,
    right: 0,
    width: BRACKET_LEN,
    height: BRACKET_W,
    borderTopRightRadius: 2,
  },
  bTRV: {
    top: 0,
    right: 0,
    width: BRACKET_W,
    height: BRACKET_LEN,
    borderTopRightRadius: 2,
  },
  bBLH: {
    bottom: 0,
    left: 0,
    width: BRACKET_LEN,
    height: BRACKET_W,
    borderBottomLeftRadius: 2,
  },
  bBLV: {
    bottom: 0,
    left: 0,
    width: BRACKET_W,
    height: BRACKET_LEN,
    borderBottomLeftRadius: 2,
  },
  bBRH: {
    bottom: 0,
    right: 0,
    width: BRACKET_LEN,
    height: BRACKET_W,
    borderBottomRightRadius: 2,
  },
  bBRV: {
    bottom: 0,
    right: 0,
    width: BRACKET_W,
    height: BRACKET_LEN,
    borderBottomRightRadius: 2,
  },

  // ── Camera top bar ──
  cameraTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  cameraTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },

  // ── Shared badge/cancel ──
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  offlineText: {
    color: Colors.forest,
    fontSize: FontSize.xs,
    fontWeight: "800",
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  cancelText: { color: "#fff", fontSize: FontSize.xs, fontWeight: "800" },

  // ── Camera bottom dock ──
  captureDock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    // subtle gradient-like bg so hint is readable over guide
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  cameraHint: {
    color: "rgba(255,255,255,0.88)",
    fontSize: FontSize.sm,
    fontWeight: "700",
    textAlign: "center",
  },
  captureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: Spacing.lg,
  },
  captureRowSide: { flex: 1 },
  captureBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#fff",
    borderWidth: 5,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  captureBtnDisabled: { opacity: 0.55 },
  captureInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
  },
  captureSubHint: {
    color: "rgba(255,255,255,0.6)",
    fontSize: FontSize.xs,
    fontWeight: "700",
    textAlign: "center",
  },

  // ── Crop stage ──
  cropStage: { ...StyleSheet.absoluteFill, backgroundColor: "#000" },
  cropShade: { position: "absolute", backgroundColor: "rgba(0,0,0,0.54)" },

  cropBox: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
  },
  // Thirds grid lines
  gridH1: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "33.3%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  gridH2: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "66.6%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  gridV1: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "33.3%",
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  gridV2: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "66.6%",
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  // Corner handles — larger hit target, smaller visual
  handle: {
    position: "absolute",
    width: HANDLE_HIT,
    height: HANDLE_HIT,
    alignItems: "center",
    justifyContent: "center",
  },
  handleTL: { left: -(HANDLE_HIT / 2), top: -(HANDLE_HIT / 2) },
  handleTR: { right: -(HANDLE_HIT / 2), top: -(HANDLE_HIT / 2) },
  handleBL: { left: -(HANDLE_HIT / 2), bottom: -(HANDLE_HIT / 2) },
  handleBR: { right: -(HANDLE_HIT / 2), bottom: -(HANDLE_HIT / 2) },

  // ── Crop header ──
  cropHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    gap: 6,
    // dark gradient so text is always readable
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingBottom: 14,
  },
  cropHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cropTitle: {
    color: "#fff",
    fontSize: FontSize.xl,
    fontWeight: "900",
    textAlign: "center",
  },
  cropSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: FontSize.sm,
    fontWeight: "700",
    textAlign: "center",
  },

  // ── Crop footer ──
  cropFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  retakeText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: "900",
  },
  confirmBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  confirmDisabled: { opacity: 0.65 },
  confirmText: { color: "#fff", fontSize: FontSize.md, fontWeight: "900" },

  pressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },

  // ── Permission screen ──
  permRoot: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  permCard: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
    borderRadius: Radius.xxl,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  permTitle: {
    color: Colors.forest,
    fontSize: FontSize.xl,
    fontWeight: "900",
    textAlign: "center",
  },
  permBody: {
    color: Colors.mutedText,
    fontSize: FontSize.md,
    lineHeight: 22,
    textAlign: "center",
  },
  permBtn: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  permBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: "900" },
  permLink: { paddingVertical: 4 },
  permLinkText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: "800",
  },
});
