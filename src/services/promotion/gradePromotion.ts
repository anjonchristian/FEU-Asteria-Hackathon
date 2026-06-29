import { Alert } from "react-native";
import { GRADES } from "../../constants/data";
import { useActivityStore } from "../../store/activity";
import { useProfile } from "../../store/profile";
import { useVaultStore } from "../../store/vault";

/**
 * Promotion criteria:
 * 1. At least 8 quizzes completed across all subjects
 * 2. Average mastery across subjects >= 75%
 * 3. At least 5 active days in the last 30 days (consistency via heatmap)
 * 4. Not already at the highest grade (Grade 6)
 * 5. Not promoted in the last 7 days (anti-spam)
 */

const MIN_QUIZZES = 8;
const MIN_MASTERY_PCT = 75;
const MIN_ACTIVE_DAYS_30 = 5;
const PROMOTION_COOLDOWN_DAYS = 7;

/** Parse "Grade X" to a number, or return null if invalid */
function gradeToNumber(grade: string): number | null {
  const match = grade.match(/Grade\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/** Get the next grade string, or null if at max */
function getNextGrade(currentGrade: string): string | null {
  const currentNum = gradeToNumber(currentGrade);
  if (currentNum === null) return null;

  const maxGradeNum = gradeToNumber(GRADES[GRADES.length - 1]);
  if (maxGradeNum === null || currentNum >= maxGradeNum) return null;

  return `Grade ${currentNum + 1}`;
}

/** Check if enough time has passed since the last promotion */
function isCooldownOver(lastPromotedAt: string | null): boolean {
  if (!lastPromotedAt) return true;
  const last = new Date(lastPromotedAt);
  const now = new Date();
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= PROMOTION_COOLDOWN_DAYS;
}

/**
 * Evaluates whether the student qualifies for a grade promotion
 * and shows a congratulatory Alert if they do.
 *
 * Call this after quiz completion.
 */
export function checkGradePromotion(): void {
  const profileState = useProfile.getState();
  const vaultState = useVaultStore.getState();
  const activityState = useActivityStore.getState();

  const { grade, lastPromotedAt } = profileState;

  // 1. Check if there's a next grade to promote to
  const nextGrade = getNextGrade(grade);
  if (!nextGrade) return; // Already at max grade

  // 2. Check cooldown
  if (!isCooldownOver(lastPromotedAt ?? null)) return;

  // 3. Check minimum quizzes completed
  const completedDecks = vaultState.decks.filter(
    (d) => d.lastScore !== undefined,
  );
  if (completedDecks.length < MIN_QUIZZES) return;

  // 4. Calculate overall mastery
  let totalEarned = 0;
  let totalPossible = 0;
  for (const deck of completedDecks) {
    totalEarned += deck.lastScore!;
    totalPossible += deck.cards.length;
  }
  const overallMastery =
    totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
  if (overallMastery < MIN_MASTERY_PCT) return;

  // 5. Check consistency — at least N active days in the last 30 days
  const heatmap30 = activityState.getHeatmapData(30);
  const activeDaysCount = heatmap30.filter((level) => level > 0).length;
  if (activeDaysCount < MIN_ACTIVE_DAYS_30) return;

  // 🎉 All criteria met — show the promotion notification!
  Alert.alert(
    "🎓 Level Up!",
    `Congratulations! You've been doing an amazing job!\n\n` +
      `📊 Mastery: ${Math.round(overallMastery)}%\n` +
      `🔥 Active Days: ${activeDaysCount} in the last 30 days\n` +
      `📝 Quizzes Completed: ${completedDecks.length}\n\n` +
      `You're ready to advance from ${grade} to ${nextGrade}! Would you like to level up?`,
    [
      { text: "Not Yet", style: "cancel" },
      {
        text: "Level Up! 🚀",
        style: "default",
        onPress: () => {
          useProfile.getState().setGrade(nextGrade);
          useProfile.getState().setLastPromotedAt(new Date().toISOString());
        },
      },
    ],
  );
}
