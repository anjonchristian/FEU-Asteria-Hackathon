import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import RadarAnimation from "../../components/study-jam/RadarAnimation";
import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";
import { useProfile } from "../../store/profile";

/**
 * Study Jam hub. It launches mock host/find BLE flows and shows persisted
 * competitive quiz history from the profile store.
 */
export default function StudyJamScreen() {
  const { studyJamHistory, clearStudyJamHistory } = useProfile();
  const [showRadar, setShowRadar] = useState(false);

  const recentHistory = studyJamHistory.slice(0, 3);

  const handleHost = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/study-jam/host" as any);
  };

  const handleFind = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowRadar(true);
  };

  const handleRadarComplete = useCallback(() => {
    setShowRadar(false);
    router.replace("/study-jam/find" as any);
  }, []);

  const handleClearHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Burahin ang history?",
      "Mawawala ang listahan ng recent Study Jam sessions.",
      [
        { text: "Hindi muna", style: "cancel" },
        {
          text: "Burahin",
          style: "destructive",
          onPress: clearStudyJamHistory,
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Study Jam</Text>
            <Text style={styles.subtitle}>
              Makipag-compete sa mga kaklase gamit ang Bluetooth
            </Text>
          </View>
          {studyJamHistory.length > 0 ? (
            <Pressable
              onPress={handleClearHistory}
              style={({ pressed }) => [
                styles.gearButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={Colors.forest}
              />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.actions}>
          <StudyJamAction
            title="Mag-host ng Study Jam"
            description="Gumawa ng session at hayaan ang iba na sumali"
            icon="broadcast"
            color={Colors.primary}
            onPress={handleHost}
          />
          <StudyJamAction
            title="Maghanap ng Study Jam"
            description="Maghanap ng malapit na session"
            icon="radar"
            color={Colors.forest}
            onPress={handleFind}
          />
        </View>

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Recent Study Jams</Text>
          <Text style={styles.sectionMeta}>{studyJamHistory.length} total</Text>
        </View>

        {recentHistory.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="trophy-outline" size={42} color={Colors.primary} />
            <Text style={styles.emptyTitle}>Wala pang Study Jam history</Text>
            <Text style={styles.emptyText}>
              Mag-host o sumali sa mock quiz para makita dito ang recent games.
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {recentHistory.map((session) => (
              <View key={session.id} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyMode}>
                    {session.mode === "host" ? "Host" : "Joined"}
                  </Text>
                  <Text style={styles.historyDate}>
                    {formatSessionDate(session.date)}
                  </Text>
                </View>
                <View style={styles.historyBottom}>
                  <Text style={styles.historyScore}>
                    {session.userScore}/10
                  </Text>
                  <Text style={styles.historyResult}>
                    {session.userWon
                      ? `Tinalo si ${session.opponentName}`
                      : `Natalo kay ${session.opponentName}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <RadarAnimation visible={showRadar} onComplete={handleRadarComplete} />
    </SafeAreaView>
  );
}

interface StudyJamActionProps {
  title: string;
  description: string;
  icon: "broadcast" | "radar";
  color: string;
  onPress: () => void;
}

function StudyJamAction({
  title,
  description,
  icon,
  color,
  onPress,
}: StudyJamActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        { borderColor: color },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={30} color="#fff" />
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={color} />
    </Pressable>
  );
}

function formatSessionDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAF7" },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  title: {
    color: Colors.forest,
    fontSize: FontSize.xxxl,
    fontWeight: "900",
  },
  subtitle: {
    color: Colors.mutedText,
    fontSize: FontSize.md,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 4,
  },
  gearButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actions: { gap: Spacing.md },
  actionCard: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: "#fff",
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  actionIcon: {
    width: 58,
    height: 58,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1, gap: 4 },
  actionTitle: {
    color: Colors.forest,
    fontSize: FontSize.lg,
    fontWeight: "900",
  },
  actionDescription: {
    color: Colors.mutedText,
    fontSize: FontSize.sm,
    fontWeight: "700",
    lineHeight: 19,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: Colors.forest,
    fontSize: FontSize.lg,
    fontWeight: "900",
  },
  sectionMeta: {
    color: Colors.mutedText,
    fontSize: FontSize.xs,
    fontWeight: "800",
  },
  emptyCard: {
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#fff",
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.border,
    padding: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.forest,
    fontSize: FontSize.md,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyText: {
    color: Colors.mutedText,
    fontSize: FontSize.sm,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
  },
  historyList: { gap: Spacing.sm },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  historyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  historyMode: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: "900",
  },
  historyDate: {
    color: Colors.mutedText,
    fontSize: FontSize.xs,
    fontWeight: "700",
  },
  historyBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  historyScore: {
    color: Colors.forest,
    fontSize: FontSize.xl,
    fontWeight: "900",
  },
  historyResult: {
    flex: 1,
    color: Colors.mutedText,
    fontSize: FontSize.sm,
    fontWeight: "800",
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
});
