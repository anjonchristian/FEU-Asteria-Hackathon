import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { QUESTIONS } from "../../constants/data";
import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";

interface QuizSessionProps {
  questions: typeof QUESTIONS;
  onComplete: (score: number, answers: boolean[]) => void;
}

type Feedback = "none" | "correct" | "incorrect";

const LETTERS = ["A", "B", "C", "D"];

/**
 * Shared mock quiz engine. It records correctness locally and advances with
 * timed feedback, mimicking a live Study Jam without network traffic.
 */
export default function QuizSession({
  questions,
  onComplete,
}: QuizSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>("none");
  const isAdvancing = useRef(false);

  const question = questions[currentIndex];
  const progress = (currentIndex + 1) / questions.length;

  const handleAnswer = (option: string) => {
    if (feedback !== "none" || isAdvancing.current) return;

    const correct = option === question.answer;
    const nextAnswers = [...answers, correct];

    setSelectedOption(option);
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
        if (currentIndex === questions.length - 1) {
          onComplete(
            nextAnswers.filter(Boolean).length,
            nextAnswers,
          );
          return;
        }

        setCurrentIndex((value) => value + 1);
        setSelectedOption(null);
        setFeedback("none");
        isAdvancing.current = false;
      },
      correct ? 800 : 1500,
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.count}>
          Question {currentIndex + 1} of {questions.length}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{question.text}</Text>
      </View>

      <View style={styles.options}>
        {question.options.map((option, index) => {
          const isSelected = selectedOption === option;
          const isCorrectAnswer = option === question.answer;
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
                showWrong && styles.optionIncorrect,
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
                  {LETTERS[index]}
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
              {showCorrect ? (
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
              ) : null}
              {showWrong ? (
                <Ionicons name="close-circle" size={22} color="#fff" />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {feedback === "correct" ? (
        <Text style={styles.correctText}>Correct!</Text>
      ) : null}
      {feedback === "incorrect" ? (
        <Text style={styles.incorrectText}>
          The correct answer is: {question.answer}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.lg,
    backgroundColor: "#F9FAF7",
  },
  topBar: { gap: Spacing.sm },
  count: {
    color: Colors.forest,
    fontSize: FontSize.sm,
    fontWeight: "900",
  },
  progressTrack: {
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: "rgba(40,148,127,0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
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
    minHeight: 58,
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
  optionIncorrect: {
    backgroundColor: "#C94343",
    borderColor: "#C94343",
  },
  letterBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(40,148,127,0.1)",
  },
  letterBadgeActive: { backgroundColor: "rgba(255,255,255,0.24)" },
  letter: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: "900",
  },
  letterActive: { color: "#fff" },
  optionText: {
    flex: 1,
    color: Colors.forest,
    fontSize: FontSize.md,
    fontWeight: "800",
    lineHeight: 21,
  },
  optionTextActive: { color: "#fff" },
  correctText: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: "900",
    textAlign: "center",
  },
  incorrectText: {
    color: "#9F2E2E",
    fontSize: FontSize.sm,
    fontWeight: "900",
    lineHeight: 20,
    textAlign: "center",
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
});
