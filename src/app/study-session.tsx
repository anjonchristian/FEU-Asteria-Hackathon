import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, FontSize, Radius, Spacing } from "../constants/theme";
import { useLocalTutor } from "../hooks/useLocalTutor";
import { saveStudySession } from "../services/tutor/historyService";
import { useActivityStore } from "../store/activity";

export default function StudySessionScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId?: string }>();
  const [inputVal, setInputVal] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  // Pass the subjectId to our new real Gemini tutor
  const { messages, isInitializing, isThinking, sendMessage } =
    useLocalTutor(subjectId);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isThinking]);

  const handleSend = () => {
    if (!inputVal.trim() || isThinking || isInitializing) return;
    sendMessage(inputVal);
    setInputVal("");
  };

  const handleExitSession = () => {
    Alert.alert(
      "Are you done?",
      "Do you want to end our study session now? I will save our chat to your profile!",
      [
        { text: "Continue", style: "cancel" },
        {
          text: "Yes, I'm Done!",
          style: "destructive",
          onPress: async () => {
            try {
              if (messages.length > 1) {
                // Save the session without reference text, but pass the subjectId
                await saveStudySession(
                  "Direct Tutor Chat",
                  messages,
                  subjectId,
                );
                // Record daily activity for streak/heatmap tracking
                useActivityStore.getState().recordActivity();
              }
            } catch (err) {
              console.error("[StudySession] Error saving history:", err);
            } finally {
              router.back();
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={handleExitSession} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Teacher Kahayag
        </Text>
        <Pressable onPress={handleExitSession} style={styles.exitBtn}>
          <Text style={styles.exitBtnText}>Done</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        {isInitializing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Connecting to Teacher...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => {
              const isAi = msg.role === "assistant";
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isAi ? styles.rowAi : styles.rowUser,
                  ]}
                >
                  {isAi && (
                    <View style={styles.avatarBox}>
                      <Text style={styles.avatarText}>👩‍🏫</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.bubble,
                      isAi ? styles.bubbleAi : styles.bubbleUser,
                    ]}
                  >
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
            {isThinking && (
              <View style={[styles.messageRow, styles.rowAi]}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>👩‍🏫</Text>
                </View>
                <View
                  style={[
                    styles.bubble,
                    styles.bubbleAi,
                    styles.thinkingBubble,
                  ]}
                >
                  <View style={styles.thinkingRow}>
                    <ActivityIndicator
                      size="small"
                      color={Colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.thinkingText}>
                      Teacher is typing...
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        <View style={styles.footer}>
          <TextInput
            style={styles.input}
            value={inputVal}
            onChangeText={setInputVal}
            placeholder="Type your question..."
            placeholderTextColor={Colors.mutedText}
            multiline
            maxLength={500}
            editable={!isInitializing && !isThinking}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputVal.trim() || isThinking || isInitializing}
            style={({ pressed }) => [
              styles.sendBtn,
              pressed && styles.pressed,
              (!inputVal.trim() || isThinking || isInitializing) &&
                styles.disabled,
            ]}
          >
            <Ionicons name="paper-plane" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: "900",
    color: Colors.forest,
    flex: 1,
    textAlign: "center",
  },
  backBtn: { flexDirection: "row", alignItems: "center", paddingRight: 12 },
  backBtnText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: "700",
  },
  exitBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  exitBtnText: { color: "#fff", fontSize: FontSize.xs + 1, fontWeight: "800" },
  chatScroll: { flex: 1 },
  chatContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  messageRow: { flexDirection: "row", gap: Spacing.sm, maxWidth: "85%" },
  rowAi: { alignSelf: "flex-start" },
  rowUser: { alignSelf: "flex-end", justifyContent: "flex-end" },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: "#E5F5EE",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  avatarText: { fontSize: 20 },
  bubble: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleAi: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 4,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  messageText: { fontSize: FontSize.sm + 1, lineHeight: 24 },
  textAi: { color: Colors.forest, fontWeight: "600" },
  textUser: { color: "#fff", fontWeight: "700" },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  loaderText: {
    fontSize: FontSize.md,
    fontWeight: "800",
    color: Colors.mutedText,
  },
  thinkingBubble: { opacity: 0.95, paddingVertical: 14 },
  thinkingRow: { flexDirection: "row", alignItems: "center" },
  thinkingText: {
    fontSize: FontSize.sm,
    color: Colors.mutedText,
    fontStyle: "italic",
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: 14,
    paddingBottom: 14,
    maxHeight: 120,
    fontSize: FontSize.md,
    color: Colors.forest,
    fontWeight: "600",
    borderWidth: 1.5,
    borderColor: "rgba(40,148,127,0.1)",
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
  disabled: { backgroundColor: "rgba(40,148,127,0.3)" },
});
