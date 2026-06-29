import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { generateAssessmentQuiz } from "../../services/sml/quizGenerator";
import { getStudySessions } from "../../services/tutor/historyService";
import { useActivityStore } from "../../store/activity";
import { useProfile } from "../../store/profile";
import { useVaultStore, type Deck } from "../../store/vault";

interface RecentItem {
  label: string;
  detail: string;
  time: string;
  color: string;
  type: "session" | "quiz";
}

export default function HomeScreen() {
  const { name, grade, score, subjects } = useProfile();
  const { decks, addDeck } = useVaultStore();
  const streak = useActivityStore((s) => s.getStreak());
  const router = useRouter();

  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);

  const mySubjects = [...SUBJECTS].filter((s) => subjects.includes(s.id));
  const shown =
    mySubjects.length > 0 ? mySubjects.slice(0, 4) : [...SUBJECTS].slice(0, 4);

  const assessScore = `${score}/10`;

  // Load real recent activity on focus
  useFocusEffect(
    useCallback(() => {
      async function loadRecent() {
        try {
          const sessions = await getStudySessions();
          const items: RecentItem[] = [];

          // Add recent study sessions
          for (const session of sessions.slice(0, 5)) {
            items.push({
              label: session.title,
              detail: `${session.messages.length} messages`,
              time: formatTimeAgo(session.timestamp),
              color: Colors.primary,
              type: "session",
            });
          }

          // Add recent quiz completions from vault
          const scoredDecks = decks
            .filter((d) => d.lastScore !== undefined)
            .slice(0, 5);
          for (const deck of scoredDecks) {
            items.push({
              label: deck.title,
              detail: `${deck.lastScore}/${deck.cards.length}`,
              time: formatTimeAgo(deck.createdAt),
              color: Colors.green,
              type: "quiz",
            });
          }

          // Sort by time (most recent first) and take top 5
          items.sort(
            (a, b) =>
              getTimestamp(b.time).getTime() - getTimestamp(a.time).getTime(),
          );
          setRecentItems(items.slice(0, 5));
        } catch (err) {
          console.error("[Home] Error loading recent activity:", err);
        }
      }
      loadRecent();
    }, [decks]),
  );

  // Today's Challenge: generate a quick quiz for a random user subject
  const handleTodaysChallenge = async () => {
    if (isGeneratingChallenge) return;
    setIsGeneratingChallenge(true);
    try {
      // Pick a random subject from user's subjects, or default
      const challengeSubjects =
        mySubjects.length > 0 ? mySubjects : [...SUBJECTS].slice(0, 4);
      const randomSubject =
        challengeSubjects[Math.floor(Math.random() * challengeSubjects.length)];

      const cards = await generateAssessmentQuiz(grade, [randomSubject.id], 5);

      const newDeck: Deck = {
        id: `challenge-${Date.now()}`,
        title: `Daily Challenge: ${randomSubject.label}`,
        subjectId: randomSubject.id,
        createdAt: new Date().toISOString(),
        cards,
      };

      addDeck(newDeck);
      router.push({ pathname: "/quiz-player", params: { deckId: newDeck.id } });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not generate challenge. Check your connection.");
    } finally {
      setIsGeneratingChallenge(false);
    }
  };

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
              <Text style={styles.greeting}>{getGreeting()} ✨</Text>
              <Text style={styles.heroName}>{name || "Learner"}!</Text>
            </View>
            <View style={styles.heroRight}>
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={15} color={Colors.yellow} />
                <Text style={styles.streakText}>{streak}</Text>
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
            onPress={handleTodaysChallenge}
            disabled={isGeneratingChallenge}
            style={({ pressed }) => [
              styles.challengeCard,
              (pressed || isGeneratingChallenge) && styles.pressed,
            ]}
          >
            <LinearGradient
              colors={[Colors.yellow, Colors.lime]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.challengeGradient}
            >
              <View style={styles.challengeIcon}>
                {isGeneratingChallenge ? (
                  <ActivityIndicator size="small" color={Colors.forest} />
                ) : (
                  <Ionicons name="sparkles" size={24} color={Colors.forest} />
                )}
              </View>
              <View style={styles.challengeText}>
                <Text style={styles.challengeTitle}>Today's Challenge</Text>
                <Text style={styles.challengeSub}>
                  {isGeneratingChallenge
                    ? "Generating your quiz..."
                    : "Tap to start a 5-question quiz!"}
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

        {/* Study Vault Access */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [
              styles.vaultCard,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push("/study-vault" as any)}
          >
            <View style={styles.vaultIcon}>
              <Ionicons name="albums" size={24} color={Colors.teal} />
            </View>
            <View style={styles.vaultText}>
              <Text style={styles.vaultTitle}>Study Vault</Text>
              <Text style={styles.vaultSub}>
                Review your AI-generated flashcards
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.teal} />
          </Pressable>
        </View>

        {/* Subjects */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Subjects</Text>
            <Pressable onPress={() => router.push("/all-subjects" as never)}>
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
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: Spacing.sm }]}>
            Recent Activity
          </Text>
          {recentItems.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Ionicons
                name="time-outline"
                size={32}
                color={Colors.mutedText}
                style={{ opacity: 0.5 }}
              />
              <Text style={styles.emptyActivityText}>
                No activity yet. Start a tutor session or take a quiz!
              </Text>
            </View>
          ) : (
            <View style={styles.activityCard}>
              {recentItems.map((item, i) => (
                <View
                  key={`${item.type}-${i}`}
                  style={[
                    styles.activityRow,
                    i < recentItems.length - 1 && styles.activityBorder,
                  ]}
                >
                  <View
                    style={[styles.activityBar, { backgroundColor: item.color }]}
                  />
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text style={styles.activityTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.activityScore}>{item.detail}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Returns a greeting based on the current time of day */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Simple relative time formatting */
function formatTimeAgo(isoString: string): string {
  try {
    const then = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return then.toLocaleDateString();
  } catch {
    return isoString;
  }
}

/** Helper to convert our time-ago strings back to a sortable Date (rough) */
function getTimestamp(timeAgo: string): Date {
  // This is used for sorting — we just need relative ordering
  const now = new Date();
  if (timeAgo === "Just now") return now;
  const mMatch = timeAgo.match(/^(\d+)m ago$/);
  if (mMatch) return new Date(now.getTime() - parseInt(mMatch[1]) * 60000);
  const hMatch = timeAgo.match(/^(\d+)h ago$/);
  if (hMatch) return new Date(now.getTime() - parseInt(hMatch[1]) * 3600000);
  if (timeAgo === "Yesterday")
    return new Date(now.getTime() - 86400000);
  const dMatch = timeAgo.match(/^(\d+) days ago$/);
  if (dMatch) return new Date(now.getTime() - parseInt(dMatch[1]) * 86400000);
  return new Date(0); // old fallback
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

  // Vault Card Styles
  vaultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: Spacing.sm,
  },
  vaultIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: "rgba(74,167,124,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  vaultText: {
    flex: 1,
  },
  vaultTitle: {
    fontSize: FontSize.sm,
    fontWeight: "900",
    color: Colors.forest,
  },
  vaultSub: {
    fontSize: FontSize.xs,
    color: "rgba(28,56,41,0.65)",
    marginTop: 2,
  },

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
  emptyActivity: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  emptyActivityText: {
    fontSize: FontSize.sm,
    color: Colors.mutedText,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
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
