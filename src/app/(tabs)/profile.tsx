import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useProfile } from "../../store/profile";
import { Colors, FontSize, Spacing, Radius } from "../../constants/theme";

export default function ProfileScreen() {
  const { name, grade, score, reset } = useProfile();

  const handleReset = () => {
    reset();
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary, Colors.teal]}
          style={styles.avatarCircle}
        >
          <Text style={styles.avatarEmoji}>🌱</Text>
        </LinearGradient>

        <Text style={styles.name}>{name || "Learner"}</Text>
        <Text style={styles.grade}>{grade}</Text>

        <View style={styles.statsRow}>
          {[
            { label: "Assessment", value: `${score}/10` },
            { label: "Streak",     value: "7 days" },
            { label: "Badges",     value: "3" },
          ].map((stat) => (
            <View key={stat.label} style={styles.statBox}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={handleReset} style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.8 }]}>
          <Ionicons name="refresh-outline" size={18} color={Colors.mutedText} />
          <Text style={styles.resetText}>Start Over</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.lg, paddingHorizontal: Spacing.xl },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 48 },
  name: { fontSize: FontSize.xxl, fontWeight: "900", color: Colors.forest },
  grade: { fontSize: FontSize.md, fontWeight: "700", color: Colors.mutedText, marginTop: -Spacing.sm },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statBox: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: FontSize.lg, fontWeight: "900", color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.mutedText },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.sm,
  },
  resetText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.mutedText },
});
