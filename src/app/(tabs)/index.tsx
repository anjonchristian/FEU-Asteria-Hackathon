import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { SUBJECTS } from "../../constants/data";
import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";
import { useProfile } from "../../store/profile";

const RECENT = [
  {
    label: "Quick Assessment",
    score: "scored",
    time: "Just now",
    color: Colors.primary,
  },
  {
    label: "Science Facts",
    score: "5/5",
    time: "Yesterday",
    color: Colors.green,
  },
  {
    label: "Reading Comp.",
    score: "7/10",
    time: "2 days ago",
    color: Colors.teal,
  },
];

export default function HomeScreen() {
  const { name, grade, score, subjects } = useProfile();

  const router = useRouter();
  const mySubjects = [...SUBJECTS].filter((s) => subjects.includes(s.id));
  const shown =
    mySubjects.length > 0 ? mySubjects.slice(0, 4) : [...SUBJECTS].slice(0, 4);

  const assessScore = `${score}/10`;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Hero header */}
        <LinearGradient
          colors={[Colors.primary, Colors.teal, Colors.green]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greeting}>Good morning ☀️</Text>
              <Text style={styles.heroName}>{name || "Learner"}!</Text>
            </View>
            <View style={styles.heroRight}>
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={15} color={Colors.yellow} />
                <Text style={styles.streakText}>7</Text>
              </View>
              <TouchableOpacity onPress={() => router.navigate("/profile")}>
                <View style={styles.avatarBox}>
                  <Ionicons name="person" size={19} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <Ionicons name="star" size={13} color={Colors.yellow} />
              <Text style={styles.heroBadgeText}>{grade}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="trophy" size={13} color={Colors.yellow} />
              <Text style={styles.heroBadgeText}>
                Assessment: {assessScore}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Today's challenge */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.challengeCard,
              pressed && styles.pressed,
            ]}
          >
            <LinearGradient
              colors={[Colors.yellow, Colors.lime]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.challengeGradient}
            >
              <View style={styles.challengeIcon}>
                <Ionicons name="sparkles" size={24} color={Colors.forest} />
              </View>
              <View style={styles.challengeText}>
                <Text style={styles.challengeTitle}>Today's Challenge</Text>
                <Text style={styles.challengeSub}>
                  Complete 3 problems to earn a badge
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.forest}
              />
            </LinearGradient>
          </Pressable>
        </View>

        {/* Subjects */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Subjects</Text>
            <Pressable>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <View style={styles.subjectsGrid}>
            {shown.map((sub, i) => (
              <Animated.View
                key={sub.id}
                entering={FadeInDown.delay(i * 60).springify()}
                style={styles.subjectWrap}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.subjectCard,
                    { backgroundColor: sub.bg },
                    pressed && styles.pressed,
                  ]}
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
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: Spacing.sm }]}>
            Recent Activity
          </Text>
          <View style={styles.activityCard}>
            {RECENT.map((item, i) => (
              <View
                key={i}
                style={[
                  styles.activityRow,
                  i < RECENT.length - 1 && styles.activityBorder,
                ]}
              >
                <View
                  style={[styles.activityBar, { backgroundColor: item.color }]}
                />
                <View style={styles.activityInfo}>
                  <Text style={styles.activityLabel}>{item.label}</Text>
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
                <Text style={styles.activityScore}>{item.score}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 32 },

  hero: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    marginBottom: 2,
  },
  heroName: { fontSize: FontSize.xxl + 4, fontWeight: "900", color: "#fff" },
  heroRight: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  streakText: { color: "#fff", fontWeight: "900", fontSize: FontSize.sm },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadges: { flexDirection: "row", gap: 8 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
  },
  heroBadgeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: FontSize.xs,
    fontWeight: "700",
  },

  section: { paddingHorizontal: Spacing.lg, marginTop: Spacing.lg },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "900",
    color: Colors.forest,
  },
  seeAll: { fontSize: FontSize.sm, fontWeight: "800", color: Colors.primary },

  challengeCard: { borderRadius: Radius.xl, overflow: "hidden" },
  challengeGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  challengeText: { flex: 1 },
  challengeTitle: {
    fontSize: FontSize.sm,
    fontWeight: "900",
    color: Colors.forest,
  },
  challengeSub: {
    fontSize: FontSize.xs,
    color: "rgba(28,56,41,0.65)",
    marginTop: 2,
  },

  subjectsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  subjectWrap: { width: "47.5%" },
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

  activityCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.sm,
  },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  activityBar: { width: 4, height: 40, borderRadius: 2 },
  activityInfo: { flex: 1 },
  activityLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.forest,
  },
  activityTime: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.mutedText,
    marginTop: 2,
  },
  activityScore: {
    fontSize: FontSize.sm,
    fontWeight: "900",
    color: Colors.primary,
  },

  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
