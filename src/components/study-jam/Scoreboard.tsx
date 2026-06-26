import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";

interface ScoreboardProps {
  userScore: number;
  totalQuestions: number;
  userAnswers: boolean[];
  opponentName: string;
  opponentScore: number;
  isHost: boolean;
  otherParticipants?: { name: string; score: number }[];
  onBack: () => void;
}

/**
 * Shared mock results view. It compares fixed simulated opponent scores with
 * the learner's answers and displays a per-question breakdown.
 */
export default function Scoreboard({
  userScore,
  totalQuestions,
  userAnswers,
  opponentName,
  opponentScore,
  isHost,
  otherParticipants = [],
  onBack,
}: ScoreboardProps) {
  const userWon = userScore > opponentScore;
  const ranking = [
    { name: isHost ? "Ikaw" : opponentName, score: isHost ? userScore : opponentScore },
    { name: isHost ? opponentName : "Ikaw", score: isHost ? opponentScore : userScore },
    ...otherParticipants,
  ].sort((a, b) => b.score - a.score);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack();
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.scoreRing}>
          <Text style={styles.scoreValue}>{userScore}</Text>
          <Text style={styles.scoreTotal}>/{totalQuestions}</Text>
        </View>
        <Text style={styles.title}>
          {userWon
            ? `Panalo ka! Natalo mo si ${opponentName}!`
            : `Mabuti ang laban! Si ${opponentName} ang nanalo ngayon.`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Score comparison</Text>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreName}>Ikaw</Text>
          <Text style={styles.scoreText}>
            {userScore}/{totalQuestions}
          </Text>
        </View>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreName}>{opponentName}</Text>
          <Text style={styles.scoreText}>
            {opponentScore}/{totalQuestions}
          </Text>
        </View>
      </View>

      {!isHost ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ranking</Text>
          {ranking.map((player, index) => (
            <View key={player.name} style={styles.rankRow}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <Text style={styles.rankName}>{player.name}</Text>
              {index === 0 ? (
                <Ionicons name="ribbon" size={18} color={Colors.yellow} />
              ) : null}
              <Text style={styles.rankScore}>
                {player.score}/{totalQuestions}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Breakdown ng sagot</Text>
        <View style={styles.breakdownGrid}>
          {userAnswers.map((correct, index) => (
            <View
              key={`${index}-${correct}`}
              style={[
                styles.breakdownItem,
                correct ? styles.breakdownCorrect : styles.breakdownWrong,
              ]}
            >
              <Ionicons
                name={correct ? "checkmark" : "close"}
                size={16}
                color="#fff"
              />
              <Text style={styles.breakdownText}>{index + 1}</Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        onPress={handleBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Ionicons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.backText}>Bumalik sa Study Jam</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9FAF7" },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  scoreRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 12,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "#fff",
  },
  scoreValue: {
    color: Colors.forest,
    fontSize: 42,
    fontWeight: "900",
  },
  scoreTotal: {
    color: Colors.mutedText,
    fontSize: FontSize.xl,
    fontWeight: "900",
  },
  title: {
    color: Colors.forest,
    fontSize: FontSize.xl,
    fontWeight: "900",
    lineHeight: 28,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: {
    color: Colors.forest,
    fontSize: FontSize.md,
    fontWeight: "900",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreName: {
    color: Colors.mutedText,
    fontSize: FontSize.sm,
    fontWeight: "800",
  },
  scoreText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: "900",
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(40,148,127,0.12)",
  },
  rankText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: "900",
  },
  rankName: {
    flex: 1,
    color: Colors.forest,
    fontSize: FontSize.sm,
    fontWeight: "800",
  },
  rankScore: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: "900",
  },
  breakdownGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  breakdownItem: {
    minWidth: 48,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: Radius.md,
  },
  breakdownCorrect: { backgroundColor: Colors.primary },
  breakdownWrong: { backgroundColor: "#C94343" },
  breakdownText: {
    color: "#fff",
    fontSize: FontSize.sm,
    fontWeight: "900",
  },
  backButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  backText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "900",
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
});
