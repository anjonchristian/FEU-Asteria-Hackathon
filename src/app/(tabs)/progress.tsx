import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SUBJECTS } from "../../constants/data";
import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";
import { getStudySessions } from "../../services/tutor/historyService";
import { useActivityStore } from "../../store/activity";
import { useProfile } from "../../store/profile";
import { useVaultStore } from "../../store/vault";

export default function ProgressScreen() {
  const { name, subjects } = useProfile();
  const streak = useActivityStore((s) => s.getStreak());
  const getHeatmapData = useActivityStore((s) => s.getHeatmapData);
  const decks = useVaultStore((s) => s.decks);

  const [totalSessions, setTotalSessions] = useState(0);

  // Load total sessions count (study sessions + completed quizzes)
  useFocusEffect(
    useCallback(() => {
      async function loadCount() {
        try {
          const sessions = await getStudySessions();
          const completedQuizzes = decks.filter(
            (d) => d.lastScore !== undefined,
          ).length;
          setTotalSessions(sessions.length + completedQuizzes);
        } catch (err) {
          console.error("[Progress] Error loading session count:", err);
        }
      }
      loadCount();
    }, [decks]),
  );

  // Real heatmap data from activity store (last 70 days)
  const heatmapData = useMemo(() => getHeatmapData(70), [getHeatmapData]);

  // Filter to only show subjects the user has selected, fallback to default if none
  const activeSubjects =
    subjects.length > 0
      ? SUBJECTS.filter((s) => subjects.includes(s.id))
      : SUBJECTS.slice(0, 4);

  // Calculate real mastery per subject from quiz scores
  const subjectMastery = useMemo(() => {
    const masteryMap: Record<string, { total: number; earned: number }> = {};

    for (const deck of decks) {
      if (deck.lastScore === undefined) continue;
      if (!masteryMap[deck.subjectId]) {
        masteryMap[deck.subjectId] = { total: 0, earned: 0 };
      }
      masteryMap[deck.subjectId].total += deck.cards.length;
      masteryMap[deck.subjectId].earned += deck.lastScore;
    }

    return masteryMap;
  }, [decks]);

  // Map activity levels to your theme colors
  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 1:
        return Colors.primary;
      default:
        return Colors.muted; // Empty state
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Progress</Text>
          <Text style={styles.headerSub}>
            Keep up the great work, {name || "Learner"}!
          </Text>
        </View>

        {/* Streak Summary Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakInfo}>
            <Ionicons name="flame" size={32} color={Colors.yellow} />
            <View>
              <Text style={styles.streakCount}>
                {streak} {streak === 1 ? "Day" : "Days"}
              </Text>
              <Text style={styles.streakLabel}>Current Streak</Text>
            </View>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakInfo}>
            <Ionicons name="trophy" size={32} color={Colors.primary} />
            <View>
              <Text style={styles.streakCount}>{totalSessions}</Text>
              <Text style={styles.streakLabel}>Total Sessions</Text>
            </View>
          </View>
        </View>

        {/* Learning Heatmap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consistency</Text>
          <View style={styles.heatmapCard}>
            <View style={styles.heatmapGrid}>
              {heatmapData.map((level, index) => (
                <View
                  key={index}
                  style={[
                    styles.heatmapBlock,
                    { backgroundColor: getHeatmapColor(level) },
                  ]}
                />
              ))}
            </View>
            <View style={styles.heatmapLegend}>
              <Text style={styles.legendText}>Less</Text>
              <View
                style={[
                  styles.legendBlock,
                  { backgroundColor: getHeatmapColor(0) },
                ]}
              />
              <View
                style={[
                  styles.legendBlock,
                  { backgroundColor: getHeatmapColor(1) },
                ]}
              />
              <Text style={styles.legendText}>More</Text>
            </View>
          </View>
        </View>

        {/* Subject Mastery Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject Mastery</Text>
          <View style={styles.masteryCard}>
            {activeSubjects.map((subject) => {
              const data = subjectMastery[subject.id];
              const masteryPct =
                data && data.total > 0
                  ? Math.round((data.earned / data.total) * 100)
                  : 0;

              return (
                <View key={subject.id} style={styles.masteryRow}>
                  <View
                    style={[styles.iconBox, { backgroundColor: subject.bg }]}
                  >
                    <Ionicons
                      name={subject.icon as any}
                      size={20}
                      color={subject.color}
                    />
                  </View>
                  <View style={styles.masteryInfo}>
                    <View style={styles.masteryHeader}>
                      <Text style={styles.subjectName}>{subject.label}</Text>
                      <Text style={styles.masteryPercent}>{masteryPct}%</Text>
                    </View>
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          {
                            width: `${masteryPct}%`,
                            backgroundColor: subject.color,
                          },
                        ]}
                      />
                    </View>
                    {data ? (
                      <Text style={styles.masteryDetail}>
                        {data.earned}/{data.total} correct across{" "}
                        {decks.filter(
                          (d) =>
                            d.subjectId === subject.id &&
                            d.lastScore !== undefined,
                        ).length}{" "}
                        {decks.filter(
                          (d) =>
                            d.subjectId === subject.id &&
                            d.lastScore !== undefined,
                        ).length === 1
                          ? "quiz"
                          : "quizzes"}
                      </Text>
                    ) : (
                      <Text style={styles.masteryDetail}>
                        No quizzes taken yet
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "900",
    color: Colors.forest,
  },
  headerSub: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.mutedText,
    marginTop: 4,
  },
  streakCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    alignItems: "center",
    justifyContent: "space-around",
  },
  streakInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  streakCount: {
    fontSize: FontSize.xl,
    fontWeight: "900",
    color: Colors.forest,
  },
  streakLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.mutedText,
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "900",
    color: Colors.forest,
  },
  heatmapCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  heatmapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-start",
  },
  heatmapBlock: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  heatmapLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: Spacing.lg,
    gap: 6,
  },
  legendText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.mutedText,
  },
  legendBlock: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  masteryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: Spacing.lg,
  },
  masteryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  masteryInfo: {
    flex: 1,
    justifyContent: "center",
  },
  masteryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  subjectName: {
    fontSize: FontSize.sm,
    fontWeight: "800",
    color: Colors.forest,
  },
  masteryPercent: {
    fontSize: FontSize.sm,
    fontWeight: "900",
    color: Colors.primary,
  },
  masteryDetail: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.mutedText,
    marginTop: 4,
  },
  track: {
    height: 8,
    backgroundColor: Colors.muted,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: Radius.full,
  },
});
