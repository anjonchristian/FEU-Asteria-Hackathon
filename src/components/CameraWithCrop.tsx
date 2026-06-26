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

const GUIDE_RATIO = 0.68;
const GUIDE_WIDTH_RATIO = 0.9;
const MIN_CROP_SIZE_PX = 100;
const BRACKET_SIZE = 30;
const BRACKET_THICKNESS = 3;

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

  const cameraGuide = useMemo(() => {
    // Vertical bounds: top bar ~80px below safe area top, dock ~120px above safe area bottom
    const topReserve = insets.top + 80;
    const bottomReserve = insets.bottom + 170;
    const availableHeight = Math.max(
      0,
      screenHeight - topReserve - bottomReserve,
    );

    const maxWidthFromScreen = screenWidth * GUIDE_WIDTH_RATIO;
    const maxWidthFromHeight = availableHeight * GUIDE_RATIO;
    const guideWidth = Math.min(maxWidthFromScreen, maxWidthFromHeight);
    const guideHeight = guideWidth / GUIDE_RATIO;
    const guideLeft = (screenWidth - guideWidth) / 2;
    // Center in the available zone, then nudge slightly upward
    const guideTop = topReserve + (availableHeight - guideHeight) / 2 - 16;

    return {
      left: guideLeft,
      top: Math.max(topReserve, guideTop),
      width: guideWidth,
      height: guideHeight,
    };
  }, [insets.bottom, insets.top, screenHeight, screenWidth]);

  const imageFrame = useMemo<ImageFrame | null>(() => {
    if (!capturedImage) return null;

    const imageAspect = capturedImage.width / capturedImage.height;
    const screenAspect = screenWidth / screenHeight;

    let width = screenWidth;
    let height = screenHeight;
    let x = 0;
    let y = 0;

    if (imageAspect > screenAspect) {
      width = screenWidth;
      height = width / imageAspect;
      y = (screenHeight - height) / 2;
    } else {
      height = screenHeight;
      width = height * imageAspect;
      x = (screenWidth - width) / 2;
    }

    return {
      x,
      y,
      width,
      height,
      scale: width / capturedImage.width,
    };
  }, [capturedImage, screenHeight, screenWidth]);

  useEffect(() => {
    if (!capturedImage || !imageFrame) return;

    // safeBottom in imageFrame-local coords: stop before the footer buttons
    const footerTopInScreen = screenHeight - (insets.bottom + 170);
    const safeBottom = Math.min(
      imageFrame.height,
      footerTopInScreen - imageFrame.y,
    );

    // Top reserve: clear the crop header (~140px from screen top)
    const headerBottomInScreen = insets.top + 140;
    const safeTop = Math.max(0, headerBottomInScreen - imageFrame.y);

    const usableHeight = Math.max(100, safeBottom - safeTop);
    const initialWidth = Math.min(
      imageFrame.width * 0.82,
      usableHeight * GUIDE_RATIO,
    );
    const initialHeight = Math.min(initialWidth / GUIDE_RATIO, usableHeight);
    const left = (imageFrame.width - initialWidth) / 2;
    const top = safeTop + (usableHeight - initialHeight) / 2;

    setCropRect({
      x: left,
      y: top,
      width: initialWidth,
      height: initialHeight,
    });
  }, [capturedImage, imageFrame, insets.bottom, insets.top, screenHeight]);

  const cropRectRef = useRef<CropRect | null>(null);
  useEffect(() => {
    cropRectRef.current = cropRect;
  }, [cropRect]);

  // Footer buttons sit at insets.bottom + ~100px from screen bottom.
  // Convert that screen-space limit into imageFrame-local Y coordinate.
  const maxCropBottom = useMemo(() => {
    if (!imageFrame) return 0;
    const footerTopInScreenSpace = screenHeight - (insets.bottom + 170);
    return footerTopInScreenSpace - imageFrame.y;
  }, [imageFrame, insets.bottom, screenHeight]);

  const buildResponder = (handle: HandleName) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartRect.current = cropRectRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!imageFrame) return;

        const current = dragStartRect.current;
        if (!current) return;

        const minSize = Math.max(MIN_CROP_SIZE_PX * imageFrame.scale, 48);
        const safeBottom = Math.min(imageFrame.height, maxCropBottom);

        const left = current.x;
        const top = current.y;
        const right = current.x + current.width;
        const bottom = current.y + current.height;

        let nextLeft = left;
        let nextTop = top;
        let nextRight = right;
        let nextBottom = bottom;

        if (handle === "topLeft") {
          nextLeft = clamp(left + gestureState.dx, 0, right - minSize);
          nextTop = clamp(top + gestureState.dy, 0, bottom - minSize);
        }

        if (handle === "topRight") {
          nextRight = clamp(
            right + gestureState.dx,
            left + minSize,
            imageFrame.width,
          );
          nextTop = clamp(top + gestureState.dy, 0, bottom - minSize);
        }

        if (handle === "bottomLeft") {
          nextLeft = clamp(left + gestureState.dx, 0, right - minSize);
          nextBottom = clamp(
            bottom + gestureState.dy,
            top + minSize,
            safeBottom,
          );
        }

        if (handle === "bottomRight") {
          nextRight = clamp(
            right + gestureState.dx,
            left + minSize,
            imageFrame.width,
          );
          nextBottom = clamp(
            bottom + gestureState.dy,
            top + minSize,
            safeBottom,
          );
        }

        setCropRect({
          x: nextLeft,
          y: nextTop,
          width: Math.max(minSize, nextRight - nextLeft),
          height: Math.max(minSize, nextBottom - nextTop),
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

  if (!permission) {
    return <View style={styles.root} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionRoot}>
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={56} color={Colors.primary} />
          <Text style={styles.permissionTitle}>
            Kailangan ang camera permission
          </Text>
          <Text style={styles.permissionBody}>
            Ibigay ang permission para makapag-scan ng textbook pages offline.
          </Text>
          <Pressable
            onPress={requestPermission}
            style={styles.permissionButton}
          >
            <Text style={styles.permissionButtonText}>Payagan ang Camera</Text>
          </Pressable>
          <Pressable onPress={onCancel} style={styles.permissionLink}>
            <Text style={styles.permissionLinkText}>Bumalik</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const cropOverlay =
    cropRect && imageFrame
      ? {
          left: imageFrame.x + cropRect.x,
          top: imageFrame.y + cropRect.y,
          width: cropRect.width,
          height: cropRect.height,
        }
      : null;

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 0.8,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 130,
          useNativeDriver: true,
        }),
      ]).start();

      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.9,
      });

      setCapturedImage({
        uri: picture.uri,
        width: picture.width,
        height: picture.height,
      });
      setPhase("crop");
    } catch (error) {
      console.error("[CameraWithCrop] capture failed:", error);
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

    try {
      setIsConfirming(true);

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
    } catch (error) {
      console.error("[CameraWithCrop] crop failed:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        active={phase === "camera"}
        facing="back"
        mode="picture"
        onCameraReady={() => setIsCameraReady(true)}
      />

      <View style={styles.dimRoot} pointerEvents="box-none">
        <SafeAreaView style={styles.safeOverlay} pointerEvents="box-none">
          {phase === "camera" ? (
            <View style={styles.cameraOverlay} pointerEvents="none">
              <View
                style={[
                  styles.dimBlock,
                  { top: 0, left: 0, right: 0, height: cameraGuide.top },
                ]}
              />
              <View
                style={[
                  styles.dimBlock,
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
                  styles.dimBlock,
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
                  styles.dimBlock,
                  {
                    left: 0,
                    right: 0,
                    top: cameraGuide.top + cameraGuide.height,
                    bottom: 0,
                  },
                ]}
              />

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
                <View style={[styles.cornerGlow, styles.cornerTL]} />
                <View style={[styles.cornerGlow, styles.cornerTR]} />
                <View style={[styles.cornerGlow, styles.cornerBL]} />
                <View style={[styles.cornerGlow, styles.cornerBR]} />

                <View style={[styles.bracketArm, styles.armTLH]} />
                <View style={[styles.bracketArm, styles.armTLV]} />
                <View style={[styles.bracketArm, styles.armTRH]} />
                <View style={[styles.bracketArm, styles.armTRV]} />
                <View style={[styles.bracketArm, styles.armBLH]} />
                <View style={[styles.bracketArm, styles.armBLV]} />
                <View style={[styles.bracketArm, styles.armBRH]} />
                <View style={[styles.bracketArm, styles.armBRV]} />
              </View>

              <View
                style={[styles.cameraHintWrap, { bottom: insets.bottom + 130 }]}
              >
                <Text style={styles.cameraHint}>
                  I-pwesto ang libro sa loob ng guide
                </Text>
              </View>
            </View>
          ) : null}

          {phase === "camera" ? (
            <View style={styles.topBar}>
              <View style={styles.offlineBadge}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={14}
                  color={Colors.primary}
                />
                <Text style={styles.offlineText}>Offline</Text>
              </View>

              <Pressable onPress={onCancel} style={styles.cancelButton}>
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.cancelText}>Lumabas</Text>
              </Pressable>
            </View>
          ) : null}
        </SafeAreaView>

        {phase === "camera" ? (
          <View
            style={[
              styles.captureDock,
              { bottom: Math.max(insets.bottom + 16, 32) },
            ]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={handleCapture}
              disabled={!isCameraReady || isCapturing}
              style={({ pressed }) => [
                styles.captureButton,
                pressed && styles.pressed,
                (!isCameraReady || isCapturing) && styles.captureButtonDisabled,
              ]}
            >
              <View style={styles.captureInner} />
            </Pressable>
            <Text style={styles.captureHint}>
              {isCameraReady ? "Tap to scan" : "Naghahanda ang camera..."}
            </Text>
          </View>
        ) : null}

        {phase === "crop" && capturedImage && imageFrame && cropOverlay ? (
          <View style={styles.cropStage}>
            <Image
              source={{ uri: capturedImage.uri }}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
            />

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
              <View style={styles.cropLineTop} />
              <View style={styles.cropLineRight} />
              <View style={styles.cropLineBottom} />
              <View style={styles.cropLineLeft} />

              <View
                {...handleResponders.topLeft.panHandlers}
                style={[styles.cropHandle, styles.handleTL]}
              />
              <View
                {...handleResponders.topRight.panHandlers}
                style={[styles.cropHandle, styles.handleTR]}
              />
              <View
                {...handleResponders.bottomLeft.panHandlers}
                style={[styles.cropHandle, styles.handleBL]}
              />
              <View
                {...handleResponders.bottomRight.panHandlers}
                style={[styles.cropHandle, styles.handleBR]}
              />
            </View>

            <View
              style={[styles.cropHeader, { top: insets.top + 10 }]}
              pointerEvents="box-none"
            >
              <View style={styles.cropHeaderRow}>
                <View style={styles.offlineBadge}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.offlineText}>Offline</Text>
                </View>
                <Pressable onPress={onCancel} style={styles.cancelButton}>
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.cancelText}>Lumabas</Text>
                </Pressable>
              </View>
              <Text style={styles.cropTitle}>I-adjust ang crop</Text>
              <Text style={styles.cropSubTitle}>
                Hilain ang mga sulok hanggang tumugma sa page.
              </Text>
            </View>

            <View
              style={[
                styles.cropFooter,
                { bottom: Math.max(insets.bottom + 16, 32) },
              ]}
              pointerEvents="box-none"
            >
              <Pressable
                onPress={handleRetake}
                style={({ pressed }) => [
                  styles.retakeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="refresh" size={20} color={Colors.primary} />
                <Text style={styles.retakeText}>Ulitin</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmCrop}
                disabled={isConfirming}
                style={({ pressed }) => [
                  styles.confirmButton,
                  pressed && styles.pressed,
                  isConfirming && styles.confirmDisabled,
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
        ) : null}

        <Animated.View
          pointerEvents="none"
          style={[styles.flashOverlay, { opacity: flashOpacity }]}
        />
      </View>
    </View>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#04110B",
  },
  dimRoot: {
    ...StyleSheet.absoluteFill,
  },
  safeOverlay: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  offlineText: {
    color: Colors.forest,
    fontSize: FontSize.sm,
    fontWeight: "800",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  cancelText: {
    color: "#fff",
    fontSize: FontSize.sm,
    fontWeight: "800",
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFill,
  },
  dimBlock: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  guideFrame: {
    position: "absolute",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    shadowColor: Colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  cornerGlow: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(40,148,127,0.18)",
    shadowColor: Colors.green,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  cornerTL: {
    top: -7,
    left: -7,
  },
  cornerTR: {
    top: -7,
    right: -7,
  },
  cornerBL: {
    bottom: -7,
    left: -7,
  },
  cornerBR: {
    bottom: -7,
    right: -7,
  },
  bracketArm: {
    position: "absolute",
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
  },
  armTLH: {
    top: 0,
    left: 0,
    borderTopWidth: BRACKET_THICKNESS,
    borderLeftWidth: BRACKET_THICKNESS,
    borderColor: "#fff",
    borderTopLeftRadius: 8,
  },
  armTLV: {
    top: 0,
    left: 0,
    borderTopWidth: BRACKET_THICKNESS,
    borderLeftWidth: BRACKET_THICKNESS,
    borderColor: "#fff",
    borderTopLeftRadius: 8,
  },
  armTRH: {
    top: 0,
    right: 0,
    borderTopWidth: BRACKET_THICKNESS,
    borderRightWidth: BRACKET_THICKNESS,
    borderColor: "#fff",
    borderTopRightRadius: 8,
  },
  armTRV: {
    top: 0,
    right: 0,
    borderTopWidth: BRACKET_THICKNESS,
    borderRightWidth: BRACKET_THICKNESS,
    borderColor: "#fff",
    borderTopRightRadius: 8,
  },
  armBLH: {
    bottom: 0,
    left: 0,
    borderBottomWidth: BRACKET_THICKNESS,
    borderLeftWidth: BRACKET_THICKNESS,
    borderColor: "#fff",
    borderBottomLeftRadius: 8,
  },
  armBLV: {
    bottom: 0,
    left: 0,
    borderBottomWidth: BRACKET_THICKNESS,
    borderLeftWidth: BRACKET_THICKNESS,
    borderColor: "#fff",
    borderBottomLeftRadius: 8,
  },
  armBRH: {
    bottom: 0,
    right: 0,
    borderBottomWidth: BRACKET_THICKNESS,
    borderRightWidth: BRACKET_THICKNESS,
    borderColor: "#fff",
    borderBottomRightRadius: 8,
  },
  armBRV: {
    bottom: 0,
    right: 0,
    borderBottomWidth: BRACKET_THICKNESS,
    borderRightWidth: BRACKET_THICKNESS,
    borderColor: "#fff",
    borderBottomRightRadius: 8,
  },
  cameraHintWrap: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: "center",
  },
  cameraHint: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "800",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  captureDock: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#fff",
    borderWidth: 5,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  captureHint: {
    marginTop: 10,
    marginBottom: -20,
    color: "rgba(255,255,255,0.9)",
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  cropStage: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#000",
  },
  cropShade: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  cropBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.88)",
    borderRadius: 18,
    shadowColor: Colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  cropLineTop: {
    position: "absolute",
    top: -1,
    left: 18,
    right: 18,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  cropLineRight: {
    position: "absolute",
    top: 18,
    bottom: 18,
    right: -1,
    width: 2,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  cropLineBottom: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: -1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  cropLineLeft: {
    position: "absolute",
    top: 18,
    bottom: 18,
    left: -1,
    width: 2,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  cropHandle: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: Colors.primary,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  handleTL: {
    left: -11,
    top: -11,
  },
  handleTR: {
    right: -11,
    top: -11,
  },
  handleBL: {
    left: -11,
    bottom: -11,
  },
  handleBR: {
    right: -11,
    bottom: -11,
  },
  cropHeader: {
    position: "absolute",
    left: Spacing.md,
    right: Spacing.md,
    alignItems: "center",
    gap: 8,
  },
  cropHeaderRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cropTitle: {
    color: "#fff",
    fontSize: FontSize.xl,
    fontWeight: "900",
    textAlign: "center",
  },
  cropSubTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: FontSize.sm,
    fontWeight: "700",
    textAlign: "center",
  },
  cropFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  retakeText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: "900",
  },
  confirmButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  confirmDisabled: {
    opacity: 0.7,
  },
  confirmText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "900",
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#fff",
  },
  permissionRoot: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  permissionCard: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
    borderRadius: Radius.xxl,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  permissionTitle: {
    color: Colors.forest,
    fontSize: FontSize.xl,
    fontWeight: "900",
    textAlign: "center",
  },
  permissionBody: {
    color: Colors.mutedText,
    fontSize: FontSize.md,
    lineHeight: 22,
    textAlign: "center",
  },
  permissionButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "900",
  },
  permissionLink: {
    paddingVertical: 4,
  },
  permissionLinkText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: "800",
  },
});
