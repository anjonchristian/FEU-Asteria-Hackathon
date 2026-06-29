import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { SUBJECTS } from "../constants/data";
import { Colors, FontSize, Radius, Spacing } from "../constants/theme";

export default function AllSubjectsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={Colors.forest} />
        </Pressable>
        <Text style={styles.headerTitle}>All Subjects</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.subjectsGrid}>
          {SUBJECTS.map((sub, i) => (
            <Animated.View
              key={sub.id}
              entering={FadeInDown.delay(i * 40).springify()}
              style={styles.subjectWrap}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.subjectCard,
                  { backgroundColor: sub.bg },
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/subject/[id]",
                    params: { id: sub.id },
                  } as never)
                }
              >
                <View
                  style={[
                    styles.subjectIconBox,
                    { backgroundColor: sub.color },
                  ]}
                >
                  <Ionicons name={sub.icon as any} size={21} color="#fff" />
                </View>
                <Text style={styles.subjectLabel}>{sub.label}</Text>
                <Text style={styles.subjectHint}>Tap to learn</Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: { width: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: "900",
    color: Colors.forest,
  },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  subjectsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  subjectWrap: { width: "48%" },
  subjectCard: {
    padding: Spacing.md,
    borderRadius: Radius.xl,
    gap: Spacing.sm,
  },
  subjectIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  subjectLabel: {
    fontSize: FontSize.sm,
    fontWeight: "900",
    color: Colors.forest,
  },
  subjectHint: {
    fontSize: FontSize.xs - 1,
    fontWeight: "600",
    color: "rgba(28,56,41,0.45)",
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
