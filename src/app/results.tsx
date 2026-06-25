import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { QUESTIONS } from "../constants/data";
import { Colors, FontSize, Radius, Spacing } from "../constants/theme";
import { useProfile } from "../store/profile";

export default function ResultsScreen() {
  // 1. Grab your score and whatever your selected subjects variable name is from your store
  // (Change 'selectedSubjects' below to match the exact key name inside your useProfile store)
  const { score } = useProfile();

  const pct = Math.round((score / QUESTIONS.length) * 100);
  const stars = score >= 9 ? 3 : score >= 6 ? 2 : 1;
  const msg =
    score >= 9
      ? "Outstanding! 🌟"
      : score >= 6
        ? "Well done! 🎉"
        : "Keep growing! 💪";

  const handleFinishOnboarding = async () => {
    try {
      // We only need to manually save the onboarding flag status here
      await AsyncStorage.setItem("HAS_SEEN_ONBOARDING", "true");
    } catch {
      // Fails silently
    } finally {
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Background blobs */}
      <View
        style={[
          styles.blob,
          { backgroundColor: Colors.yellow, top: -60, right: -60 },
        ]}
      />
      <View
        style={[
          styles.blob,
          { backgroundColor: Colors.green, bottom: -40, left: -40 },
        ]}
      />

      <View style={styles.container}>
        <Animated.View entering={ZoomIn.springify()} style={styles.awardWrap}>
          <LinearGradient
            colors={[Colors.primary, Colors.green]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.awardCircle}
          >
            <Ionicons name="trophy" size={56} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.textBlock}
        >
          <Text style={styles.msg}>{msg}</Text>
          <Text style={styles.sub}>
            You got{" "}
            <Text style={styles.scoreHighlight}>
              {score} out of {QUESTIONS.length}
            </Text>{" "}
            correct
          </Text>
        </Animated.View>

        {/* Stars */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.starsRow}
        >
          {[1, 2, 3].map((s) => (
            <Ionicons
              key={s}
              name={s <= stars ? "star" : "star-outline"}
              size={44}
              color={Colors.yellow}
            />
          ))}
        </Animated.View>

        {/* Score ring */}
        <Animated.View
          entering={ZoomIn.delay(400).springify()}
          style={styles.ring}
        >
          <Text style={styles.ringText}>{pct}%</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(500).springify()}
          style={styles.btnWrap}
        >
          <Pressable
            onPress={handleFinishOnboarding}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>Start Learning!</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  blob: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.25,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  awardWrap: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  awardCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { alignItems: "center", gap: 6 },
  msg: {
    fontSize: FontSize.xxl + 2,
    fontWeight: "900",
    color: Colors.forest,
    textAlign: "center",
  },
  sub: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.mutedText,
    textAlign: "center",
  },
  scoreHighlight: { fontWeight: "900", color: Colors.primary },
  starsRow: { flexDirection: "row", gap: Spacing.sm },
  ring: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 7,
    borderColor: Colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  ringText: {
    fontSize: FontSize.xl,
    fontWeight: "900",
    color: Colors.forest,
  },
  btnWrap: {
    width: "100%",
    marginTop: Spacing.sm,
  },
  btn: {
    borderRadius: Radius.lg,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  btnText: { color: "#fff", fontSize: FontSize.lg, fontWeight: "800" },
});
