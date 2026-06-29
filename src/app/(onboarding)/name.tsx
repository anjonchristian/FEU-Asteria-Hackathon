import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";
import { useProfile } from "../../store/profile";

export default function NameScreen() {
  const { name, setName } = useProfile();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Background blob */}
        <View style={styles.blob} />

        <View style={styles.container}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={18} color={Colors.mutedText} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <Animated.View entering={FadeInDown.springify()} style={styles.hero}>
            <Text style={styles.emoji}>👋</Text>
            <Text style={styles.heading}>What should we</Text>
            <Text style={[styles.heading, { color: Colors.primary }]}>
              call you?
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name..."
              placeholderTextColor={Colors.mutedText}
              style={styles.input}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() =>
                name.trim() && router.navigate("/(onboarding)/grade")
              }
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Pressable
              onPress={() =>
                name.trim() && router.navigate("/(onboarding)/grade")
              }
              disabled={!name.trim()}
              style={({ pressed }) => [
                styles.btn,
                !name.trim() && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.teal]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Text style={styles.btnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  blob: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.yellow,
    opacity: 0.25,
    top: -50,
    right: -50,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    justifyContent: "space-between",
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.xxl,
  },
  backText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.mutedText,
  },
  hero: { flex: 1, gap: Spacing.xs },
  emoji: { fontSize: 56, marginBottom: Spacing.sm },
  heading: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.forest,
    lineHeight: 36,
  },
  input: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 16,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.forest,
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
  btnDisabled: { opacity: 0.4 },
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
