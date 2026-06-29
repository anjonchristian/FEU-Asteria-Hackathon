import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, FontSize, Radius, Spacing } from "../constants/theme";
import { checkGradePromotion } from "../services/promotion/gradePromotion";
import { useActivityStore } from "../store/activity";
import { useVaultStore } from "../store/vault";

type Feedback = "none" | "correct" | "incorrect";
const LETTERS = ["A", "B", "C", "D"];

export default function QuizPlayerScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { decks, updateDeckScore } = useVaultStore();

  const deck = decks.find((d) => d.id === deckId);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>("none");
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  const isAdvancing = useRef(false);

  if (!deck) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Deck not found.</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const card = deck.cards[index];
  const progress = (index + 1) / deck.cards.length;
  const score = answers.filter(Boolean).length;

  const handleAnswer = (option: string) => {
    if (feedback !== "none" || isAdvancing.current) return;

    const correct = option === card.answer;
    const nextAnswers = [...answers, correct];

    setSelected(option);
    setFeedback(correct ? "correct" : "incorrect");
    setAnswers(nextAnswers);

    Haptics.notificationAsync(
      correct
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    );

    isAdvancing.current = true;
    setTimeout(
      () => {
        if (index === deck.cards.length - 1) {
          const finalScore = nextAnswers.filter(Boolean).length;
          updateDeckScore(deck.id, finalScore);
          // Record daily activity for streak/heatmap tracking
          useActivityStore.getState().recordActivity();
          setDone(true);
          isAdvancing.current = false;

          // Check for grade promotion after a short delay
          // so the results screen renders first
          setTimeout(() => {
            checkGradePromotion();
          }, 1500);
          return;
        }
        setIndex((v) => v + 1);
        setSelected(null);
        setFeedback("none");
        isAdvancing.current = false;
      },
      correct ? 800 : 1500,
    );
  };

  if (done) {
    const pct = Math.round((score / deck.cards.length) * 100);
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.results}>
          <View style={styles.scoreRing}>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreTotal}>/{deck.cards.length}</Text>
          </View>

          <Text style={styles.resultsTitle}>
            {pct >= 80
              ? "Great job! 🌟"
              : pct >= 50
                ? "Good effort! 💪"
                : "Keep trying! 📖"}
          </Text>
          <Text style={styles.resultsPct}>{pct}% correct</Text>

          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>Breakdown</Text>
            <View style={styles.breakdownGrid}>
              {answers.map((correct, i) => (
                <View
                  key={i}
                  style={[
                    styles.breakdownItem,
                    correct ? styles.breakdownCorrect : styles.breakdownWrong,
                  ]}
                >
                  <Ionicons
                    name={correct ? "checkmark" : "close"}
                    size={14}
                    color="#fff"
                  />
                  <Text style={styles.breakdownNum}>{i + 1}</Text>
                </View>
              ))}
            </View>
          </View>

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.doneBtnText}>Back to Vault</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.exitBtn}>
          <Ionicons name="close" size={22} color={Colors.mutedText} />
        </Pressable>
        <Text style={styles.deckTitle} numberOfLines={1}>
          {deck.title}
        </Text>
        <Text style={styles.counter}>
          {index + 1}/{deck.cards.length}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.body}>
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{card.question}</Text>
        </View>

        <View style={styles.options}>
          {card.options.map((option, i) => {
            const isSelected = selected === option;
            const isCorrectAnswer = option === card.answer;
            const showCorrect = feedback !== "none" && isCorrectAnswer;
            const showWrong =
              feedback === "incorrect" && isSelected && !isCorrectAnswer;

            return (
              <Pressable
                key={option}
                onPress={() => handleAnswer(option)}
                disabled={feedback !== "none"}
                style={({ pressed }) => [
                  styles.option,
                  pressed && styles.pressed,
                  showCorrect && styles.optionCorrect,
                  showWrong && styles.optionWrong,
                ]}
              >
                <View
                  style={[
                    styles.letterBadge,
                    (showCorrect || showWrong) && styles.letterBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.letter,
                      (showCorrect || showWrong) && styles.letterActive,
                    ]}
                  >
                    {LETTERS[i]}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.optionText,
                    (showCorrect || showWrong) && styles.optionTextActive,
                  ]}
                >
                  {option}
                </Text>
                {showCorrect && (
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                )}
                {showWrong && (
                  <Ionicons name="close-circle" size={20} color="#fff" />
                )}
              </Pressable>
            );
          })}
        </View>

        {feedback === "correct" && (
          <Text style={styles.feedbackCorrect}>Correct! ✅</Text>
        )}
        {feedback === "incorrect" && (
          <Text style={styles.feedbackWrong}>The correct answer is: {card.answer}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAF7" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.mutedText,
    fontWeight: "700",
  },
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
  exitBtn: { padding: 4 },
  deckTitle: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "900",
    color: Colors.forest,
    textAlign: "center",
    paddingHorizontal: Spacing.sm,
  },
  counter: {
    fontSize: FontSize.sm,
    fontWeight: "800",
    color: Colors.mutedText,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(40,148,127,0.12)",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  body: { flex: 1, padding: Spacing.lg, gap: Spacing.lg },
  questionCard: {
    backgroundColor: "#fff",
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  questionText: {
    color: Colors.forest,
    fontSize: FontSize.lg,
    fontWeight: "900",
    lineHeight: 26,
  },
  options: { gap: Spacing.sm },
  option: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  optionCorrect: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionWrong: { backgroundColor: "#C94343", borderColor: "#C94343" },
  letterBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(40,148,127,0.1)",
  },
  letterBadgeActive: { backgroundColor: "rgba(255,255,255,0.24)" },
  letter: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: "900" },
  letterActive: { color: "#fff" },
  optionText: {
    flex: 1,
    color: Colors.forest,
    fontSize: FontSize.md,
    fontWeight: "800",
    lineHeight: 20,
  },
  optionTextActive: { color: "#fff" },
  feedbackCorrect: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: "900",
    textAlign: "center",
  },
  feedbackWrong: {
    color: "#9F2E2E",
    fontSize: FontSize.sm,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 20,
  },
  results: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    alignItems: "center",
    paddingBottom: Spacing.xxl,
  },
  scoreRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 10,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "#fff",
    marginTop: Spacing.lg,
  },
  scoreValue: { color: Colors.forest, fontSize: 38, fontWeight: "900" },
  scoreTotal: {
    color: Colors.mutedText,
    fontSize: FontSize.xl,
    fontWeight: "900",
  },
  resultsTitle: {
    color: Colors.forest,
    fontSize: FontSize.xl,
    fontWeight: "900",
    textAlign: "center",
  },
  resultsPct: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: "800",
  },
  breakdown: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  breakdownTitle: {
    color: Colors.forest,
    fontSize: FontSize.md,
    fontWeight: "900",
  },
  breakdownGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  breakdownItem: {
    minWidth: 44,
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: Radius.md,
  },
  breakdownCorrect: { backgroundColor: Colors.primary },
  breakdownWrong: { backgroundColor: "#C94343" },
  breakdownNum: { color: "#fff", fontSize: FontSize.xs, fontWeight: "900" },
  doneBtn: {
    width: "100%",
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  doneBtnText: { color: "#fff", fontSize: FontSize.md, fontWeight: "900" },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  backBtnText: { color: "#fff", fontWeight: "900", fontSize: FontSize.md },
  pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
});
