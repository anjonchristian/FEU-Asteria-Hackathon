import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
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
import {
    broadcastQuizStart,
    startHostServer,
    stopHostServer,
} from "../../services/studyJam/multiplayer";
import { useProfile } from "../../store/profile";

type HostPhase = "initializing" | "waiting" | "quiz" | "scoreboard";

export default function HostStudyJamScreen() {
  const addStudyJamSession = useProfile((state) => state.addStudyJamSession);
  const [phase, setPhase] = useState<HostPhase>("initializing");
  const [joinCode, setJoinCode] = useState<string | null | undefined>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const pulse = useRef(new Animated.Value(0)).current;
  const savedRef = useRef(false);

  // Fallback mock opponent data for UI purposes until live sync is fully wired
  const MOCK_OPPONENT_SCORE = 7;

  useEffect(() => {
    let isMounted = true;

    async function initServer() {
      try {
        const result = await startHostServer(
          (name) => {
            if (isMounted) {
              setParticipants((prev) => [...prev, name]);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
            }
          },
          (opponentScore) => {
            console.log("Opponent scored:", opponentScore);
            // Future: Sync live scores here
          },
        );
        if (isMounted) {
          setJoinCode(result.joinCode);
          setPhase("waiting");
        }
      } catch (err) {
        if (isMounted) {
          alert("Paki-on ang iyong Mobile Hotspot o kumonekta sa Wi-Fi.");
          router.back();
        }
      }
    }

    initServer();

    // Pulse animation for waiting screen
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();

    return () => {
      isMounted = false;
      stopHostServer();
      pulseLoop.stop();
    };
  }, [pulse]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    broadcastQuizStart();
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
        opponentName: participants[0] || "Opponent",
        opponentScore: MOCK_OPPONENT_SCORE,
        userWon: nextScore > MOCK_OPPONENT_SCORE,
        answers: nextAnswers,
      });
    }
    setPhase("scoreboard");
  };

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.1],
  });

  if (phase === "initializing") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.subtitle}>Sinisimulan ang local server...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          opponentName={participants[0] || "Opponent"}
          opponentScore={MOCK_OPPONENT_SCORE}
          isHost
          onBack={() => router.replace("/study-jam" as any)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.waiting}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={Colors.mutedText} />
        </Pressable>

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
            <Ionicons name="wifi" size={56} color="#fff" />
          </View>
        </View>

        <Text style={styles.title}>Magpa-connect ng Kaklase</Text>
        <Text style={styles.subtitle}>
          Ipa-connect sila sa iyong Mobile Hotspot o parehong Wi-Fi at ibigay
          ang code sa ibaba.
        </Text>

        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>JOIN CODE</Text>
          <Text style={styles.codeValue}>{joinCode}</Text>
        </View>

        {participants.length > 0 ? (
          <View style={styles.joinedCard}>
            <View style={styles.joinedIcon}>
              <Ionicons name="people" size={20} color="#fff" />
            </View>
            <View style={styles.joinedText}>
              <Text style={styles.joinedTitle}>
                {participants.length} sumali sa session
              </Text>
              <Text style={styles.joinedSub} numberOfLines={1}>
                Kasama si: {participants.join(", ")}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.waitingText}>Naghihintay ng mga sasali...</Text>
        )}

        {participants.length > 0 ? (
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.pressed,
            ]}
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  waiting: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  backButton: {
    position: "absolute",
    top: Spacing.xl,
    right: Spacing.lg,
    padding: Spacing.sm,
  },
  broadcastWrap: {
    width: 190,
    height: 190,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary,
  },
  phoneCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    color: Colors.forest,
    fontSize: FontSize.xl,
    fontWeight: "900",
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  subtitle: {
    color: Colors.mutedText,
    fontSize: FontSize.sm + 1,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  codeContainer: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: Colors.teal,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    alignItems: "center",
    marginTop: Spacing.sm,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  codeLabel: {
    color: Colors.teal,
    fontSize: FontSize.xs,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  codeValue: {
    color: Colors.forest,
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 4,
  },
  waitingText: {
    color: Colors.mutedText,
    fontSize: FontSize.sm,
    fontWeight: "600",
    fontStyle: "italic",
    marginTop: Spacing.lg,
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
    marginTop: Spacing.md,
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
    fontSize: FontSize.sm + 1,
    fontWeight: "900",
  },
  joinedSub: {
    color: Colors.mutedText,
    fontSize: FontSize.xs,
    fontWeight: "700",
    marginTop: 2,
  },
  startButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    alignSelf: "stretch",
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    marginTop: Spacing.sm,
  },
  startText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "900",
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
});
