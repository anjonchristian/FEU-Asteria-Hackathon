import { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useProfile } from "../store/profile";
import { QUESTIONS } from "../constants/data";
import { Colors, Radius, Spacing, FontSize } from "../constants/theme";

export default function AssessmentScreen() {
  const { setScore } = useProfile();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers]   = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked]     = useState(false);

  const progressWidth = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%` as any,
  }));

  const q = QUESTIONS[currentQ];

  const advanceQuestion = useCallback(
    (newAnswers: string[]) => {
      setSelected(null);
      setLocked(false);
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ((n) => n + 1);
        progressWidth.value = withTiming(((currentQ + 1) / QUESTIONS.length) * 100, { duration: 400 });
      } else {
        const finalScore = newAnswers.filter((a, i) => a === QUESTIONS[i].answer).length;
        setScore(finalScore);
        router.replace("/results");
      }
    },
    [currentQ, progressWidth, setScore]
  );

  const handleAnswer = (option: string) => {
    if (locked) return;
    setSelected(option);
    setLocked(true);

    if (option === q.answer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    const newAnswers = [...answers, option];
    setAnswers(newAnswers);

    setTimeout(() => runOnJS(advanceQuestion)(newAnswers), 900);
  };

  const getOptionStyle = (option: string) => {
    if (!locked || option !== selected && option !== q.answer) return {};
    if (option === q.answer) return styles.optionCorrect;
    if (option === selected) return styles.optionWrong;
    return {};
  };

  const getOptionTextStyle = (option: string) => {
    if (!locked || (option !== selected && option !== q.answer)) return {};
    if (option === q.answer) return { color: Colors.primary };
    if (option === selected) return { color: "#EF4444" };
    return {};
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.counter}>{currentQ + 1} of {QUESTIONS.length}</Text>
          <View style={styles.dots}>
            {QUESTIONS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < currentQ && styles.dotDone,
                  i === currentQ && styles.dotCurrent,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>

        {/* Question card */}
        <Animated.View
          key={currentQ}
          entering={FadeInRight.springify()}
          style={styles.questionCard}
        >
          <View style={styles.starBox}>
            <Ionicons name="star" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.questionText}>{q.text}</Text>
        </Animated.View>

        {/* Options */}
        <View style={styles.optionsGrid}>
          {q.options.map((option, i) => (
            <Animated.View
              key={option}
              entering={FadeInRight.delay(i * 60).springify()}
              style={styles.optionWrap}
            >
              <Pressable
                onPress={() => handleAnswer(option)}
                style={({ pressed }) => [
                  styles.option,
                  getOptionStyle(option),
                  pressed && !locked && styles.optionPressed,
                ]}
              >
                <Text style={[styles.optionText, getOptionTextStyle(option)]}>
                  {option}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  counter: { fontSize: FontSize.sm, fontWeight: "800", color: Colors.mutedText },
  dots: { flexDirection: "row", gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D8E8D0",
  },
  dotDone:    { backgroundColor: Colors.primary },
  dotCurrent: { backgroundColor: Colors.green },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.muted,
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  questionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  starBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.yellow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  questionText: {
    fontSize: FontSize.xl,
    fontWeight: "900",
    color: Colors.forest,
    lineHeight: 30,
  },
  optionsGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    alignContent: "flex-start",
  },
  optionWrap: { width: "47.5%" },
  option: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  optionCorrect: { backgroundColor: "#E5F5EE", borderColor: Colors.primary },
  optionWrong:   { backgroundColor: "#FEF2F2", borderColor: "#EF4444" },
  optionPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  optionText: {
    fontSize: FontSize.sm,
    fontWeight: "800",
    color: Colors.forest,
    textAlign: "center",
  },
});
