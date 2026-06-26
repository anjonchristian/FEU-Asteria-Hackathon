import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import QuizSession from "../../components/study-jam/QuizSession";
import Scoreboard from "../../components/study-jam/Scoreboard";
import { QUESTIONS } from "../../constants/data";
import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";
import { useProfile } from "../../store/profile";

type HostPhase = "waiting" | "quiz" | "scoreboard";

const OPPONENT_NAME = "Redmi Note 12";
const OPPONENT_SCORE = 7;

/**
 * Mock host flow. A fake nearby phone auto-joins after six seconds, then the
 * learner starts a local quiz and saves the result to profile history.
 */
export default function HostStudyJamScreen() {
  const addStudyJamSession = useProfile((state) => state.addStudyJamSession);
  const [phase, setPhase] = useState<HostPhase>("waiting");
  const [participantJoined, setParticipantJoined] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const pulse = useRef(new Animated.Value(0)).current;
  const savedRef = useRef(false);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();

    const joinTimer = setTimeout(() => {
      setParticipantJoined(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 6000);

    return () => {
      clearTimeout(joinTimer);
      pulseLoop.stop();
    };
  }, [pulse]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("quiz");
  };

  const handleComplete = (nextScore: number, nextAnswers: boolean[]) => {
    setScore(nextScore);
    setAnswers(nextAnswers);
    if (!savedRef.current) {
      savedRef.current = true;
      addStudyJamSession({
        id: `host-${Date.now()}`,
        date: new Date().toISOString(),
        mode: "host",
        userScore: nextScore,
        opponentName: OPPONENT_NAME,
        opponentScore: OPPONENT_SCORE,
        userWon: nextScore > OPPONENT_SCORE,
        answers: nextAnswers,
      });
    }
    setPhase("scoreboard");
  };

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.1],
  });

  if (phase === "quiz") {
    return (
      <SafeAreaView style={styles.safe}>
        <QuizSession questions={QUESTIONS} onComplete={handleComplete} />
      </SafeAreaView>
    );
  }

  if (phase === "scoreboard") {
    return (
      <SafeAreaView style={styles.safe}>
        <Scoreboard
          userScore={score}
          totalQuestions={QUESTIONS.length}
          userAnswers={answers}
          opponentName={OPPONENT_NAME}
          opponentScore={OPPONENT_SCORE}
          isHost
          onBack={() => router.replace("/study-jam" as any)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.waiting}>
        <View style={styles.broadcastWrap}>
          <Animated.View
            style={[
              styles.pulse,
              {
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
          <View style={styles.phoneCircle}>
            <Ionicons name="phone-portrait" size={56} color="#fff" />
          </View>
        </View>

        <Text style={styles.title}>Naghihintay ng mga sasali...</Text>
        <Text style={styles.subtitle}>Siguraduhing naka-on ang Bluetooth</Text>

        {participantJoined ? (
          <View style={styles.joinedCard}>
            <View style={styles.joinedIcon}>
              <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
            </View>
            <View style={styles.joinedText}>
              <Text style={styles.joinedTitle}>
                Si {OPPONENT_NAME} ay sumali sa session!
              </Text>
              <Text style={styles.joinedSub}>Ready na para sa Grade 5 Review Quiz</Text>
            </View>
          </View>
        ) : null}

        {participantJoined ? (
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
          >
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.startText}>Simulan ang Study Jam</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAF7" },
  waiting: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  broadcastWrap: {
    width: 190,
    height: 190,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: Colors.primary,
  },
  phoneCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  title: {
    color: Colors.forest,
    fontSize: FontSize.xl,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: Colors.mutedText,
    fontSize: FontSize.md,
    fontWeight: "700",
    textAlign: "center",
  },
  joinedCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#fff",
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  joinedIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
  joinedText: { flex: 1 },
  joinedTitle: {
    color: Colors.forest,
    fontSize: FontSize.sm,
    fontWeight: "900",
  },
  joinedSub: {
    color: Colors.mutedText,
    fontSize: FontSize.xs,
    fontWeight: "700",
    marginTop: 2,
  },
  startButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    alignSelf: "stretch",
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  startText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "900",
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
});
