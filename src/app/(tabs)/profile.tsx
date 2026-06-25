import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import { useProfile } from "../../store/profile";
import { Colors, FontSize, Spacing, Radius } from "../../constants/theme";
import {
  getStudySessions,
  clearStudyHistory,
  type ChatSession,
} from "../../services/tutor/historyService";

export default function ProfileScreen() {
  const { name, grade, score, reset } = useProfile();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null,
  );

  // Load past study sessions whenever the screen is focused
  const loadSessions = useCallback(async () => {
    try {
      const history = await getStudySessions();
      setSessions(history);
    } catch (err) {
      console.error("[ProfileScreen] Error loading study history:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  const handleReset = () => {
    AlertConfirm("Start Over?", "Sigurado ka ba na gusto mong simulan muli ang lahat ng leksyon at burahin ang history?", async () => {
      reset();
      await clearStudyHistory();
      setSessions([]);
      router.replace("/");
    });
  };

  const handleClearHistory = () => {
    AlertConfirm("Bura Study History?", "Sigurado ka ba na gusto mong burahin ang lahat ng iyong naka-save na study sessions?", async () => {
      await clearStudyHistory();
      setSessions([]);
    });
  };

  // Safe helper to trigger standard Alert without native import errors
  const AlertConfirm = (title: string, message: string, onConfirm: () => void) => {
    // We can use standard react-native Alert
    const { Alert } = require("react-native");
    Alert.alert(title, message, [
      { text: "Bumalik", style: "cancel" },
      { text: "Burahin", style: "destructive", onPress: onConfirm },
    ]);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Profile Card */}
        <View style={styles.profileSection}>
          <LinearGradient
            colors={[Colors.primary, Colors.teal]}
            style={styles.avatarCircle}
          >
            <Text style={styles.avatarEmoji}>🌱</Text>
          </LinearGradient>

          <Text style={styles.name}>{name || "Learner"}</Text>
          <Text style={styles.grade}>{grade}</Text>

          <View style={styles.statsRow}>
            {[
              { label: "Assessment", value: `${score}/10` },
              { label: "Streak", value: "7 days" },
              { label: "Badges", value: "3" },
            ].map((stat) => (
              <View key={stat.label} style={styles.statBox}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Study History Section */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="journal-outline" size={20} color={Colors.forest} />
              <Text style={styles.sectionTitle}>Naka-save na mga Aralin 📚</Text>
            </View>
            {sessions.length > 0 && (
              <Pressable onPress={handleClearHistory} style={styles.clearBtn}>
                <Text style={styles.clearText}>I-clear</Text>
              </Pressable>
            )}
          </View>

          {sessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="book-outline" size={48} color={Colors.mutedText} style={{ opacity: 0.5 }} />
              <Text style={styles.emptyTitle}>Wala pang naka-save na aralin</Text>
              <Text style={styles.emptySub}>
                Mag-scan ng libro o worksheet gamit ang Scan tab para simulan ang pakikipag-chat sa iyong AI Tutor! 📖
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {sessions.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedSession(item)}
                  style={({ pressed }) => [
                    styles.historyCard,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.titleRow}>
                      <Ionicons
                        name="book"
                        size={16}
                        color={Colors.primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                    <Text style={styles.cardDate}>{formatDate(item.timestamp)}</Text>
                  </View>
                  <Text style={styles.cardSnippet} numberOfLines={2}>
                    {item.scannedText}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Ionicons name="chatbubbles-outline" size={14} color={Colors.mutedText} />
                    <Text style={styles.msgCount}>
                      {item.messages.length} messages
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Start Over Button */}
        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="refresh-outline" size={18} color={Colors.mutedText} />
          <Text style={styles.resetText}>Simulan Muli (Reset Account)</Text>
        </Pressable>
      </ScrollView>

      {/* Read-only History Viewer Modal */}
      {selectedSession && (
        <Modal
          visible={!!selectedSession}
          animationType="slide"
          onRequestClose={() => setSelectedSession(null)}
        >
          <SafeAreaView style={styles.modalSafe}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Pressable
                onPress={() => setSelectedSession(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={Colors.forest} />
              </Pressable>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {selectedSession.title}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Reference Text Panel */}
              <View style={styles.modalRefBox}>
                <Text style={styles.modalRefTitle}>Na-scan na Teksto 📖</Text>
                <Text style={styles.modalRefText}>
                  {selectedSession.scannedText}
                </Text>
              </View>

              {/* Chat Transcript Panel */}
              <Text style={styles.transcriptTitle}>Usapan Ninyo ni Teacher Kahayag 💬</Text>

              <View style={styles.transcriptList}>
                {selectedSession.messages.map((msg) => {
                  const isAi = msg.role === "assistant";
                  return (
                    <View
                      key={msg.id}
                      style={[
                        styles.modalMsgRow,
                        isAi ? styles.rowAi : styles.rowUser,
                      ]}
                    >
                      {isAi && (
                        <View style={styles.modalAvatar}>
                          <Text style={{ fontSize: 16 }}>🌱</Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.modalBubble,
                          isAi ? styles.bubbleAi : styles.bubbleUser,
                        ]}
                      >
                        {isAi && (
                          <Text style={styles.teacherName}>Teacher Kahayag</Text>
                        )}
                        <Text
                          style={[
                            styles.messageText,
                            isAi ? styles.textAi : styles.textUser,
                          ]}
                        >
                          {msg.content}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scrollContainer: {
    paddingBottom: Spacing.xl,
  },
  profileSection: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarEmoji: { fontSize: 44 },
  name: { fontSize: FontSize.xl, fontWeight: "900", color: Colors.forest },
  grade: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.mutedText, marginTop: -4 },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.sm + 4,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.sm,
  },
  statBox: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: FontSize.md + 1, fontWeight: "900", color: Colors.primary },
  statLabel: { fontSize: FontSize.xs - 1, fontWeight: "700", color: Colors.mutedText },

  // History styles
  historySection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "900",
    color: Colors.forest,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearText: {
    fontSize: FontSize.xs + 1,
    color: "#D32F2F",
    fontWeight: "800",
  },
  listContainer: {
    gap: Spacing.sm,
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSize.sm + 1,
    fontWeight: "900",
    color: Colors.forest,
    flex: 1,
  },
  cardDate: {
    fontSize: FontSize.xs,
    color: Colors.mutedText,
    fontWeight: "600",
  },
  cardSnippet: {
    fontSize: FontSize.xs + 1,
    color: Colors.mutedText,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  msgCount: {
    fontSize: FontSize.xs,
    color: Colors.mutedText,
    fontWeight: "700",
  },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: "900",
    color: Colors.forest,
    textAlign: "center",
  },
  emptySub: {
    fontSize: FontSize.xs + 1,
    color: Colors.mutedText,
    textAlign: "center",
    lineHeight: 18,
  },

  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: Spacing.xl,
    paddingVertical: 12,
  },
  resetText: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.mutedText },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },

  // Modal styles
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: "#fff",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalHeaderTitle: {
    fontSize: FontSize.md,
    fontWeight: "900",
    color: Colors.forest,
    flex: 1,
    textAlign: "center",
  },
  modalScroll: {
    padding: Spacing.md,
  },
  modalRefBox: {
    backgroundColor: "#fff",
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  modalRefTitle: {
    fontSize: FontSize.sm,
    fontWeight: "900",
    color: Colors.primary,
    marginBottom: 6,
  },
  modalRefText: {
    fontSize: FontSize.xs + 1,
    color: Colors.forest,
    lineHeight: 18,
  },
  transcriptTitle: {
    fontSize: FontSize.md,
    fontWeight: "900",
    color: Colors.forest,
    marginBottom: Spacing.sm,
  },
  transcriptList: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  modalMsgRow: { flexDirection: "row", gap: Spacing.sm, maxWidth: "85%" },
  rowAi: { alignSelf: "flex-start" },
  rowUser: { alignSelf: "flex-end", justifyContent: "flex-end" },
  modalAvatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.muted,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  modalBubble: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleAi: {
    backgroundColor: "#fff",
    borderTopLeftRadius: Radius.sm,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.sm,
    borderColor: Colors.primary,
  },
  teacherName: {
    fontSize: FontSize.xs - 1,
    fontWeight: "900",
    color: Colors.teal,
    marginBottom: 4,
  },
  messageText: { fontSize: FontSize.sm, lineHeight: 20 },
  textAi: { color: Colors.forest, fontWeight: "500" },
  textUser: { color: "#fff", fontWeight: "700" },
});
