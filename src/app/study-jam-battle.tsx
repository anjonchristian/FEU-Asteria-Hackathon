import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";
import QuizSession from "../components/study-jam/QuizSession";
import Scoreboard from "../components/study-jam/Scoreboard";
import { Colors } from "../constants/theme";
import { useMultiplayerStore } from "../services/studyJam/multiplayer";
import { useProfile } from "../store/profile";

export default function StudyJamBattleScreen() {
  const router = useRouter();
  const { me, players, questions, status, leaveRoom } = useMultiplayerStore();
  const { addStudyJamSession } = useProfile();

  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [opponentScore, setOpponentScore] = useState(0);

  // Show loading screen while host generates quiz
  if (status === "generating") {
    return (
      <SafeAreaView style={styles.centerSafe}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.centerText}>Generating Quiz Questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Safety fallback if no questions were generated (and not generating)
  if (!questions || questions.length === 0) {
    leaveRoom();
    router.replace("/(tabs)/study-jam");
    return null;
  }

  // Map generated questions to what QuizSession expects (renaming `question` to `text`)
  const mappedQuestions = questions.map((q: any) => ({
    text: q.question,
    options: q.options,
    answer: q.answer,
  }));

  const handleComplete = (finalScore: number, finalAnswers: boolean[]) => {
    setScore(finalScore);
    setAnswers(finalAnswers);
    setCompleted(true);

    const opponent = players.find((p) => p.id !== me?.id);
    const isHost = me?.isHost ?? false;

    // Simulate an opponent score for now since we haven't implemented real-time sync of scores yet
    const simulatedOpponentScore = Math.floor(Math.random() * (mappedQuestions.length + 1));
    setOpponentScore(simulatedOpponentScore);
    const userWon = finalScore > simulatedOpponentScore;

    // Save to profile history
    addStudyJamSession({
      id: `jam-${Date.now()}`,
      date: new Date().toISOString(),
      mode: isHost ? "host" : "joined",
      userScore: finalScore,
      opponentName: opponent?.name || "Opponent",
      opponentScore: simulatedOpponentScore,
      userWon,
      answers: finalAnswers,
    });
  };

  const handleBack = () => {
    leaveRoom();
    router.replace("/(tabs)/study-jam");
  };

  const opponent = players.find((p) => p.id !== me?.id);
  const isHost = me?.isHost ?? false;

  return (
    <SafeAreaView style={styles.safe}>
      {!completed ? (
        <QuizSession
          questions={mappedQuestions as any}
          onComplete={handleComplete}
        />
      ) : (
        <Scoreboard
          userScore={score}
          totalQuestions={mappedQuestions.length}
          userAnswers={answers}
          opponentName={opponent?.name || "Opponent"}
          opponentScore={opponentScore}
          isHost={isHost}
          onBack={handleBack}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerSafe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  centerText: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.mutedText,
  },
});
