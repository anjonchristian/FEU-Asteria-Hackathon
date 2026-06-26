import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import QuizSession from "../../components/study-jam/QuizSession";
import Scoreboard from "../../components/study-jam/Scoreboard";
import { QUESTIONS } from "../../constants/data";
import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";
import {
    disconnectClient,
    joinStudyJam,
} from "../../services/studyJam/multiplayer";
import { useProfile } from "../../store/profile";

type FindPhase =
  | "input"
  | "joining"
  | "waiting"
  | "starting"
  | "quiz"
  | "scoreboard";

export default function FindStudyJamScreen() {
  const { name } = useProfile();
  const addStudyJamSession = useProfile((state) => state.addStudyJamSession);

  const [phase, setPhase] = useState<FindPhase>("input");
  const [code, setCode] = useState("");
  const [startCount, setStartCount] = useState(3);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const savedRef = useRef(false);

  // Fallback mock opponent data for UI purposes until live sync is fully wired
  const HOST_NAME = "Host Player";
  const HOST_SCORE = 7;

  useEffect(() => {
    return () => disconnectClient();
  }, []);

  useEffect(() => {
    if (phase !== "starting") return;

    setStartCount(3);
    const interval = setInterval(() => {
      setStartCount((value) => {
        if (value <= 1) {
          clearInterval(interval);
          setPhase("quiz");
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  const handleConnect = async () => {
    if (!code.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("joining");

    try {
      await joinStudyJam(code.trim(), name || "Learner", () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPhase("starting");
      });
      setPhase("waiting");
    } catch (err) {
      alert(
        "Hindi maka-connect. Siguraduhing naka-connect ka sa hotspot ng Host at tama ang code.",
      );
      setPhase("input");
    }
  };

  const handleComplete = (nextScore: number, nextAnswers: boolean[]) => {
    setScore(nextScore);
    setAnswers(nextAnswers);
    if (!savedRef.current) {
      savedRef.current = true;
      addStudyJamSession({
        id: `joined-${Date.now()}`,
        date: new Date().toISOString(),
        mode: "joined",
        userScore: nextScore,
        opponentName: HOST_NAME,
        opponentScore: HOST_SCORE,
        userWon: nextScore > HOST_SCORE,
        answers: nextAnswers,
      });
    }
    setPhase("scoreboard");
  };

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
          opponentName={HOST_NAME}
          opponentScore={HOST_SCORE}
          isHost={false}
          onBack={() => router.replace("/study-jam" as any)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.mutedText} />
        </Pressable>

        {phase === "input" || phase === "joining" ? (
          <View style={styles.content}>
            <View style={styles.iconBox}>
              <Ionicons name="search" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Sumali sa Study Jam</Text>

            <View style={styles.stepsBox}>
              <Text style={styles.stepText}>
                1. Kumonekta sa Hotspot o Wi-Fi ng Host.
              </Text>
              <Text style={styles.stepText}>
                2. Ilagay ang Join Code na nasa screen nila.
              </Text>
            </View>

            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Hal. 105"
              placeholderTextColor={Colors.mutedText}
              keyboardType="number-pad"
              maxLength={4}
              editable={phase !== "joining"}
              style={styles.input}
            />

            <Pressable
              onPress={handleConnect}
              disabled={phase === "joining" || !code.trim()}
              style={({ pressed }) => [
                styles.joinButton,
                (pressed || !code.trim()) && styles.pressed,
                phase === "joining" && styles.disabled,
              ]}
            >
              {phase === "joining" ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="log-in-outline" size={22} color="#fff" />
              )}
              <Text style={styles.joinText}>
                {phase === "joining" ? "Kumokonekta..." : "Connect"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {phase === "waiting" ? (
          <View style={styles.content}>
            <View style={[styles.iconBox, { backgroundColor: Colors.green }]}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
            <Text style={styles.title}>Connected!</Text>
            <Text style={styles.waitText}>
              Nakahanda ka na. Naghihintay sa host para simulan ang quiz...
            </Text>
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={{ marginTop: Spacing.xl }}
            />
          </View>
        ) : null}

        {phase === "starting" ? (
          <View style={styles.startPanel}>
            <Text style={styles.startCount}>
              {startCount > 0 ? `${startCount}...` : "SIMULA!"}
            </Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAF7" },
  container: { flex: 1 },
  backButton: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(40,148,127,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.forest,
    fontSize: FontSize.xxl,
    fontWeight: "900",
    textAlign: "center",
  },
  stepsBox: {
    backgroundColor: "#fff",
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    width: "100%",
    marginBottom: Spacing.sm,
  },
  stepText: {
    color: Colors.mutedText,
    fontSize: FontSize.sm + 1,
    fontWeight: "700",
    lineHeight: 24,
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: Colors.teal,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    fontSize: 36,
    fontWeight: "900",
    color: Colors.forest,
    textAlign: "center",
    letterSpacing: 2,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  joinButton: {
    width: "100%",
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    marginTop: Spacing.sm,
  },
  joinText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "900",
  },
  waitText: {
    color: Colors.mutedText,
    fontSize: FontSize.md,
    fontWeight: "700",
    lineHeight: 24,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  startPanel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  startCount: {
    color: Colors.primary,
    fontSize: 72,
    fontWeight: "900",
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.75 },
});
