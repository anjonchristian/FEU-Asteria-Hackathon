import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, FontSize, Radius, Spacing } from "../constants/theme";

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Background blobs */}
        <View
          style={[
            styles.blob,
            {
              backgroundColor: Colors.green,
              top: -60,
              right: -60,
              width: 220,
              height: 220,
            },
          ]}
        />
        <View
          style={[
            styles.blob,
            {
              backgroundColor: Colors.yellow,
              bottom: 40,
              left: -40,
              width: 180,
              height: 180,
            },
          ]}
        />
        <View
          style={[
            styles.blob,
            {
              backgroundColor: Colors.teal,
              top: "40%",
              left: -30,
              width: 120,
              height: 120,
            },
          ]}
        />

        {/* Logo + wordmark */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.hero}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.teal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBox}
          >
            <Text style={styles.logoEmoji}>🌱</Text>
          </LinearGradient>

          <Text style={styles.wordmark}>Kahayag</Text>
          <Text style={styles.tagline}>Learning grows here</Text>
          <Text style={styles.sub}>
            Your personal learning companion,{"\n"}growing with you every day.
          </Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View
          entering={FadeInUp.delay(400).springify()}
          style={styles.cta}
        >
          <Pressable
            onPress={() => router.replace("/(onboarding)/language")}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.teal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
          <Text style={styles.footer}>Free forever for learners</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: "space-between",
    paddingVertical: Spacing.xxl,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: Radius.full,
    opacity: 0.25,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 56,
  },
  wordmark: {
    fontSize: FontSize.xxxl + 8,
    fontWeight: "900",
    color: Colors.forest,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.primary,
    marginTop: 2,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.mutedText,
    textAlign: "center",
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  cta: {
    gap: Spacing.sm,
    alignItems: "center",
  },
  btn: {
    width: "100%",
    borderRadius: Radius.lg,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: FontSize.lg,
    fontWeight: "800",
  },
  footer: {
    fontSize: FontSize.xs,
    color: Colors.mutedText,
    fontWeight: "600",
  },
});
