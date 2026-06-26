import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";

interface RadarAnimationProps {
  visible: boolean;
  onComplete: () => void;
}

const DOTS = [
  { left: 58, top: 44, delay: 0 },
  { left: 132, top: 72, delay: 320 },
  { left: 88, top: 138, delay: 640 },
];

/**
 * Mock BLE discovery overlay. It simulates a radar sweep for exactly three
 * seconds, reports one found session, then lets the parent navigate onward.
 */
export default function RadarAnimation({
  visible,
  onComplete,
}: RadarAnimationProps) {
  const sweep = useRef(new Animated.Value(0)).current;
  const dotOpacity = useMemo(
    () => DOTS.map(() => new Animated.Value(0.2)),
    [],
  );
  const [found, setFound] = useState(false);

  useEffect(() => {
    if (!visible) {
      sweep.stopAnimation();
      sweep.setValue(0);
      setFound(false);
      return;
    }

    const sweepLoop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const dotLoops = dotOpacity.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(DOTS[index].delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.18,
            duration: 550,
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    sweepLoop.start();
    dotLoops.forEach((loop) => loop.start());

    const foundTimer = setTimeout(() => {
      setFound(true);
      sweep.stopAnimation();
    }, 3000);

    const closeTimer = setTimeout(onComplete, 3500);

    return () => {
      clearTimeout(foundTimer);
      clearTimeout(closeTimer);
      sweepLoop.stop();
      dotLoops.forEach((loop) => loop.stop());
    };
  }, [dotOpacity, onComplete, sweep, visible]);

  const rotation = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.radar}>
          <View style={[styles.ring, styles.outerRing]} />
          <View style={[styles.ring, styles.middleRing]} />
          <View style={[styles.ring, styles.innerRing]} />
          <Animated.View
            style={[styles.sweep, { transform: [{ rotate: rotation }] }]}
          />
          {DOTS.map((dot, index) => (
            <Animated.View
              key={`${dot.left}-${dot.top}`}
              style={[
                styles.dot,
                {
                  left: dot.left,
                  top: dot.top,
                  opacity: dotOpacity[index],
                },
              ]}
            />
          ))}
          {found ? <View style={styles.pingDot} /> : null}
        </View>
        <Text style={styles.title}>
          {found
            ? "Nakahanap ng 1 session!"
            : "Naghahanap ng malapit na Study Jam..."}
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl,
    backgroundColor: "rgba(0,0,0,0.85)",
    padding: Spacing.xl,
  },
  radar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    backgroundColor: "#082219",
    borderWidth: 2,
    borderColor: "rgba(40,148,127,0.8)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  ring: {
    position: "absolute",
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(132,186,99,0.35)",
  },
  outerRing: { width: 170, height: 170 },
  middleRing: { width: 116, height: 116 },
  innerRing: { width: 58, height: 58 },
  sweep: {
    position: "absolute",
    width: 98,
    height: 3,
    left: 100,
    top: 98.5,
    backgroundColor: Colors.green,
    borderRadius: 2,
    transformOrigin: "left center",
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.yellow,
  },
  pingDot: {
    position: "absolute",
    left: 132,
    top: 72,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.yellow,
    borderWidth: 3,
    borderColor: "#fff",
  },
  title: {
    color: "#fff",
    fontSize: FontSize.lg,
    fontWeight: "900",
    textAlign: "center",
  },
});
