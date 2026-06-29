import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SUBJECTS } from "../../constants/data";
import { Colors, FontSize, Radius, Spacing } from "../../constants/theme";
import {
  getStudySessions,
  type ChatSession,
} from "../../services/tutor/historyService";
import { useVaultStore } from "../../store/vault";

import { ActivityIndicator, Alert } from "react-native";
import { generateAssessmentQuiz } from "../../services/sml/quizGenerator";
import { useProfile } from "../../store/profile";
import type { Deck } from "../../store/vault";

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { decks, addDeck } = useVaultStore();
  const { grade, language } = useProfile();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(
    null,
  );

  // Find the matching subject metadata (icon, colors, etc.)
  const subject = SUBJECTS.find((s) => s.id === id);

  // Filter vault decks for this specific subject
  const subjectDecks = decks.filter((d) => d.subjectId === id);

  const [isGenerating, setIsGenerating] = useState(false);

  const handleDirectQuizGeneration = async () => {
    setIsGenerating(true);
    try {
      // Calls Gemini directly to build a curriculum quiz
      const cards = await generateAssessmentQuiz(grade, [id], 10, language);

      const newDeck: Deck = {
        id: `deck-${Date.now()}`,
        title: `${subject?.label} Mastery Quiz`,
        subjectId: id,
        createdAt: new Date().toISOString(),
        cards,
      };

      addDeck(newDeck);
      router.push({ pathname: "/quiz-player", params: { deckId: newDeck.id } });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not generate quiz. Check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      async function loadSessions() {
        const history = await getStudySessions();
        // Filter history for this specific subject
        setSessions(history.filter((h) => h.subjectId === id));
      }
      loadSessions();
    }, [id]),
  );

  if (!subject) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Subject not found.</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={Colors.forest} />
        </Pressable>
        <Text style={styles.headerTitle}>{subject.label}</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Subject Hero */}
        <View style={[styles.heroBox, { backgroundColor: subject.bg }]}>
          <View
            style={[styles.heroIconBox, { backgroundColor: subject.color }]}
          >
            <Ionicons name={subject.icon as any} size={48} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>{subject.label} Mastery</Text>
          <Text style={styles.heroSub}>Choose how you want to learn today</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable
            // Routes directly to the chat, passing the subject ID
            onPress={() =>
              router.push({
                pathname: "/study-session",
                params: { subjectId: id },
              })
            }
            style={({ pressed }) => [
              styles.actionBtn,
              { borderColor: subject?.color },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="chatbubbles" size={24} color={subject?.color} />
            <Text style={[styles.actionBtnText, { color: subject?.color }]}>
              Tutor
            </Text>
          </Pressable>

          <Pressable
            // Triggers the direct API call
            onPress={handleDirectQuizGeneration}
            disabled={isGenerating}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: subject?.color, borderColor: subject?.color },
              (pressed || isGenerating) && styles.pressed,
            ]}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="albums" size={24} color="#fff" />
            )}
            <Text style={[styles.actionBtnText, { color: "#fff" }]}>
              {isGenerating ? "Generating..." : "Generate Quiz"}
            </Text>
          </Pressable>
        </View>

        {/* Study Cards & Quiz History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Cards & Quizzes</Text>
          {subjectDecks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No quizzes generated yet. Tap 'Generate Quiz' to scan a lesson
                and build a deck!
              </Text>
            </View>
          ) : (
            <View style={styles.deckList}>
              {subjectDecks.map((deck) => (
                <Pressable
                  key={deck.id}
                  style={({ pressed }) => [
                    styles.itemCard,
                    pressed && styles.pressed,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/quiz-player",
                      params: { deckId: deck.id },
                    })
                  }
                >
                  <View
                    style={[styles.itemIcon, { backgroundColor: subject.bg }]}
                  >
                    <Ionicons name="albums" size={20} color={subject.color} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {deck.title}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {deck.cards.length} Cards{" "}
                      {deck.lastScore !== undefined
                        ? `• Score: ${deck.lastScore}`
                        : ""}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.mutedText}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Past Conversations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Conversations</Text>
          {sessions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No past conversations. Tap 'Tutor' to start chatting
                with Teacher Kahayag!
              </Text>
            </View>
          ) : (
            <View style={styles.deckList}>
              {sessions.map((session) => (
                <Pressable
                  key={session.id}
                  onPress={() => setSelectedSession(session)}
                  style={({ pressed }) => [
                    styles.itemCard,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[styles.itemIcon, { backgroundColor: "#E5F5EE" }]}
                  >
                    <Ionicons name="book" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {session.title}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {session.messages.length} messages •{" "}
                      {new Date(session.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.mutedText}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>
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
              {selectedSession.scannedText ? (
                <View style={styles.modalRefBox}>
                  <Text style={styles.modalRefTitle}>Scanned Text 📖</Text>
                  <Text style={styles.modalRefText}>
                    {selectedSession.scannedText}
                  </Text>
                </View>
              ) : null}

              {/* Chat Transcript */}
              <Text style={styles.transcriptTitle}>
                Conversation with Teacher Kahayag 💬
              </Text>

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
                          <Text style={styles.teacherName}>
                            Teacher Kahayag
                          </Text>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.mutedText,
    fontWeight: "700",
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  backBtnText: { color: "#fff", fontWeight: "900", fontSize: FontSize.md },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: { width: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: "900",
    color: Colors.forest,
  },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  heroBox: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
  },
  heroIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  heroTitle: { fontSize: FontSize.xl, fontWeight: "900", color: Colors.forest },
  heroSub: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.forest,
    opacity: 0.8,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: Radius.lg,
    borderWidth: 2,
  },
  actionBtnText: { fontSize: FontSize.sm, fontWeight: "900" },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "900",
    color: Colors.forest,
    marginBottom: Spacing.sm,
  },
  emptyCard: {
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.mutedText,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  deckList: { gap: Spacing.sm },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  itemInfo: { flex: 1 },
  itemTitle: {
    fontSize: FontSize.sm,
    fontWeight: "900",
    color: Colors.forest,
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.mutedText,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

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
