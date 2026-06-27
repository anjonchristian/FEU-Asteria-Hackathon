import { Ionicons } from "@expo/vector-icons";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, FontSize, Radius, Spacing } from "../constants/theme";

interface CropViewProps {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  onCropComplete: (croppedUri: string) => void;
  onCancel: () => void;
}

type CropRect = { x: number; y: number; width: number; height: number };
type HandleName = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
type ImageFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
};

const GUIDE_RATIO = 0.68;
const MIN_CROP_PX = 80;
const CROP_FOOTER_HEIGHT = 80;
const CROP_HEADER_HEIGHT = 110;
const HANDLE_HIT = 44;

export default function CropView({
  imageUri,
  imageWidth,
  imageHeight,
  onCropComplete,
  onCancel,
}: CropViewProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const dragStartRect = useRef<CropRect | null>(null);
  const cropRectRef = useRef<CropRect | null>(null);

  // How the image fits on screen (contain mode)
  const imageFrame = useMemo<ImageFrame>(() => {
    const imgAspect = imageWidth / imageHeight;
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
    return { x, y, width: w, height: h, scale: w / imageWidth };
  }, [imageWidth, imageHeight, screenWidth, screenHeight]);

  // Set initial crop rect centered in the safe zone
  useEffect(() => {
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
  }, [imageFrame, insets.bottom, insets.top, screenHeight]);

  useEffect(() => {
    cropRectRef.current = cropRect;
  }, [cropRect]);

  // Max Y before footer
  const maxCropBottom = useMemo(() => {
    const footerTop = screenHeight - (insets.bottom + CROP_FOOTER_HEIGHT);
    return footerTop - imageFrame.y;
  }, [imageFrame, insets.bottom, screenHeight]);

  const buildResponder = (handle: HandleName) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartRect.current = cropRectRef.current;
      },
      onPanResponderMove: (_, g) => {
        const cur = dragStartRect.current;
        if (!cur) return;
        const minSize = Math.max(MIN_CROP_PX * imageFrame.scale, 48);
        const safeBottom = Math.min(imageFrame.height, maxCropBottom);
        let { x: l, y: t } = cur;
        let r = l + cur.width,
          b = t + cur.height;

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

  const handleConfirm = async () => {
    if (!cropRect || isConfirming) return;
    setIsConfirming(true);
    try {
      const originX = clamp(
        Math.round(cropRect.x / imageFrame.scale),
        0,
        imageWidth - 1,
      );
      const originY = clamp(
        Math.round(cropRect.y / imageFrame.scale),
        0,
        imageHeight - 1,
      );
      const width = clamp(
        Math.round(cropRect.width / imageFrame.scale),
        1,
        imageWidth - originX,
      );
      const height = clamp(
        Math.round(cropRect.height / imageFrame.scale),
        1,
        imageHeight - originY,
      );
      const result = await ImageManipulator.manipulate(imageUri)
        .crop({ originX, originY, width, height })
        .renderAsync();
      const saved = await result.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.95,
      });
      onCropComplete(saved.uri);
    } catch (e) {
      console.error("[CropView] crop failed:", e);
    } finally {
      setIsConfirming(false);
    }
  };

  const cropOverlay = cropRect
    ? {
        left: imageFrame.x + cropRect.x,
        top: imageFrame.y + cropRect.y,
        width: cropRect.width,
        height: cropRect.height,
      }
    : null;

  return (
    <View style={styles.root}>
      {/* Full image */}
      <Image
        source={{ uri: imageUri }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
      />

      {/* Full-screen shade base — ensures status bar + gesture bar zones are always dark */}
      <View
        style={[styles.shade, StyleSheet.absoluteFill]}
        pointerEvents="none"
      />

      {cropOverlay && (
        <>
          {/* 4 quadrant shades on top of the base (same opacity = double-darkens outside crop) */}
          <View
            style={[
              styles.shade,
              { top: 0, left: 0, right: 0, height: cropOverlay.top },
            ]}
          />
          <View
            style={[
              styles.shade,
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
              styles.shade,
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
              styles.shade,
              {
                top: cropOverlay.top + cropOverlay.height,
                left: 0,
                right: 0,
                bottom: 0,
              },
            ]}
          />

          {/* Crop box */}
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
            {/* Rule-of-thirds grid */}
            <View style={styles.gridH1} />
            <View style={styles.gridH2} />
            <View style={styles.gridV1} />
            <View style={styles.gridV2} />

            {/* Handles */}
            <View
              {...handleResponders.topLeft.panHandlers}
              style={[styles.handle, styles.handleTL]}
            >
              <View style={styles.handleDot} />
            </View>
            <View
              {...handleResponders.topRight.panHandlers}
              style={[styles.handle, styles.handleTR]}
            >
              <View style={styles.handleDot} />
            </View>
            <View
              {...handleResponders.bottomLeft.panHandlers}
              style={[styles.handle, styles.handleBL]}
            >
              <View style={styles.handleDot} />
            </View>
            <View
              {...handleResponders.bottomRight.panHandlers}
              style={[styles.handle, styles.handleBR]}
            >
              <View style={styles.handleDot} />
            </View>
          </View>
        </>
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
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
        <Text style={styles.title}>I-adjust ang crop</Text>
        <Text style={styles.subtitle}>
          Hilain ang mga sulok para tumugma sa page
        </Text>
      </View>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom + 16, 24) },
        ]}
      >
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [styles.retakeBtn, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={18} color={Colors.primary} />
          <Text style={styles.retakeText}>Ulitin</Text>
        </Pressable>

        <Pressable
          onPress={handleConfirm}
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
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  shade: { position: "absolute", backgroundColor: "rgba(0,0,0,0.54)" },

  cropBox: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 10,
  },
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
  handleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: Colors.primary,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingBottom: 14,
    gap: 4,
    // Solid dark so no undimmed gap at the very top (status bar zone)
    backgroundColor: "#000",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
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
  title: {
    color: "#fff",
    fontSize: FontSize.xl,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: FontSize.sm,
    fontWeight: "700",
    textAlign: "center",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: 14,
    // Solid dark so no undimmed gap at the very bottom (gesture bar zone)
    backgroundColor: "#000",
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
});
