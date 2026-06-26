import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

type FindPhase = "found" | "joining" | "waiting" | "starting" | "quiz" | "scoreboard";

const HOST_NAME = "Samsung Galaxy A14";
const OTHER_NAME = "Cherry Mobile Aqua S10";
const HOST_SCORE = 7;
const OTHER_SCORE = 5;

/**
 * Mock join flow. It simulates joining a discovered BLE session, waiting for
 * the host countdown, running the shared quiz, and saving the result.
 */
export default function FindStudyJamScreen() {
  const addStudyJamSession = useProfile((state) => state.addStudyJamSession);
  const [phase, setPhase] = useState<FindPhase>("found");
  const [waitCount, setWaitCount] = useState(5);
  const [startCount, setStartCount] = useState(3);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const savedRef = useRef(false);

  useEffect(() => {
    if (phase !== "waiting") return;

    setWaitCount(5);
    const interval = setInterval(() => {
      setWaitCount((value) => {
        if (value <= 1) {
          clearInterval(interval);
          setPhase("starting");
          return 1;
        }
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

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

  const handleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("joining");
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase("waiting");
    }, 1000);
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
          otherParticipants={[{ name: OTHER_NAME, score: OTHER_SCORE }]}
          onBack={() => router.replace("/study-jam" as any)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {phase === "found" || phase === "joining" ? (
          <>
            <Text style={styles.title}>May nahanap na session</Text>
            <View style={styles.sessionCard}>
              <View style={styles.cardTop}>
                <View style={styles.hostIcon}>
                  <Ionicons name="phone-portrait" size={28} color="#fff" />
                </View>
                <View style={styles.hostText}>
                  <Text style={styles.hostName}>{HOST_NAME}</Text>
                  <Text style={styles.topic}>Grade 5 Review Quiz</Text>
                  <Text style={styles.participants}>2 nang naka-join</Text>
                </View>
                <SignalBars />
              </View>
              <Pressable
                onPress={handleJoin}
                disabled={phase === "joining"}
                style={({ pressed }) => [
                  styles.joinButton,
                  pressed && styles.pressed,
                  phase === "joining" && styles.disabled,
                ]}
              >
                {phase === "joining" ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                )}
                <Text style={styles.joinText}>
                  {phase === "joining" ? "Sumasali..." : "Sumali sa Session"}
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {phase === "waiting" ? (
          <View style={styles.waitingPanel}>
            <Text style={styles.title}>Naka-join ka na</Text>
            <View style={styles.peopleCard}>
              <Participant name={HOST_NAME} role="Host" crown />
              <Participant name="Ikaw" role="Participant" highlighted />
              <Participant name={OTHER_NAME} role="Participant" />
            </View>
            <Text style={styles.waitText}>
              Naghihintay sa host para simulan ang session...
            </Text>
            <Text style={styles.countdown}>Magsisimula sa {waitCount}...</Text>
          </View>
        ) : null}

        {phase === "starting" ? (
          <View style={styles.startPanel}>
            <Text style={styles.startCount}>
              {startCount > 0 ? `${startCount}...` : "SIMULA!"}
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function SignalBars() {
  return (
    <View style={styles.signal}>
      {[12, 18, 24].map((height) => (
        <View key={height} style={[styles.signalBar, { height }]} />
      ))}
    </View>
  );
}

interface ParticipantProps {
  name: string;
  role: string;
  crown?: boolean;
  highlighted?: boolean;
}

function Participant({ name, role, crown, highlighted }: ParticipantProps) {
  return (
    <View style={[styles.participantRow, highlighted && styles.youRow]}>
      <Ionicons
        name={crown ? "ribbon" : "person-circle-outline"}
        size={24}
        color={highlighted ? "#fff" : Colors.primary}
      />
      <View style={styles.participantText}>
        <Text style={[styles.personName, highlighted && styles.youText]}>{name}</Text>
        <Text style={[styles.personRole, highlighted && styles.youSubText]}>
          {role}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAF7" },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  title: {
    color: Colors.forest,
    fontSize: FontSize.xl,
    fontWeight: "900",
    textAlign: "center",
  },
  sessionCard: {
    backgroundColor: "#fff",
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  hostIcon: {
    width: 58,
    height: 58,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.forest,
  },
  hostText: { flex: 1, gap: 2 },
  hostName: {
    color: Colors.forest,
    fontSize: FontSize.lg,
    fontWeight: "900",
  },
  topic: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: "800",
  },
  participants: {
    color: Colors.mutedText,
    fontSize: FontSize.xs,
    fontWeight: "700",
  },
  signal: {
    height: 28,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
  signalBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  joinButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  joinText: {
    color: "#fff",
    fontSize: FontSize.md,
    fontWeight: "900",
  },
  disabled: { opacity: 0.75 },
  waitingPanel: { gap: Spacing.lg },
  peopleCard: {
    backgroundColor: "#fff",
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  participantRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
  },
  youRow: { backgroundColor: Colors.primary },
  participantText: { flex: 1 },
  personName: {
    color: Colors.forest,
    fontSize: FontSize.sm,
    fontWeight: "900",
  },
  personRole: {
    color: Colors.mutedText,
    fontSize: FontSize.xs,
    fontWeight: "700",
  },
  youText: { color: "#fff" },
  youSubText: { color: "rgba(255,255,255,0.78)" },
  waitText: {
    color: Colors.mutedText,
    fontSize: FontSize.md,
    fontWeight: "800",
    lineHeight: 22,
    textAlign: "center",
  },
  countdown: {
    color: Colors.primary,
    fontSize: FontSize.xl,
    fontWeight: "900",
    textAlign: "center",
  },
  startPanel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  startCount: {
    color: Colors.primary,
    fontSize: 54,
    fontWeight: "900",
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
});
