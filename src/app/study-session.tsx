import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
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

export default function StudySessionScreen() {
  const [inputVal, setInputVal] = useState("");
  const [showRefText, setShowRefText] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const { messages, isInitializing, isThinking, sendMessage, referenceText } =
    useLocalTutor();

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
      "Tapos ka na ba? 🌟",
      "Gusto mo na bang tapusin ang ating pag-aaral ngayon? Ma-save ang ating chat sa iyong profile!",
      [
        {
          text: "Ipagpatuloy pa 📝",
          style: "cancel",
        },
        {
          text: "Oo, Tapos Na! 🎉",
          style: "destructive",
          onPress: async () => {
            try {
              if (messages.length > 0) {
                await saveStudySession(referenceText, messages);
              }
            } catch (err) {
              console.error("[StudySession] Error saving history:", err);
            } finally {
              router.replace("/(tabs)");
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
          <Text style={styles.backBtnText}>Bumalik</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Study Session
        </Text>
        <Pressable onPress={handleExitSession} style={styles.exitBtn}>
          <Text style={styles.exitBtnText}>Tapos Na 🎉</Text>
        </Pressable>
      </View>

      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          Mock water cycle tutor lang ito. I-scan muna ang water cycle page,
          tapos mag-chat ka sa AI tutor.
        </Text>
      </View>

      {referenceText ? (
        <View style={styles.refCardWrap}>
          <Pressable
            onPress={() => setShowRefText(!showRefText)}
            style={styles.refHeader}
          >
            <Ionicons
              name={showRefText ? "book" : "book-outline"}
              size={18}
              color={Colors.primary}
            />
            <Text style={styles.refHeaderText}>
              {showRefText
                ? "Itago ang Binabasang Teksto 📖"
                : "Tignan ang Binabasang Teksto 📖"}
            </Text>
            <Ionicons
              name={showRefText ? "chevron-up" : "chevron-down"}
              size={18}
              color={Colors.primary}
            />
          </Pressable>
          {showRefText && (
            <ScrollView style={styles.refScroll} nestedScrollEnabled>
              <Text style={styles.refText}>{referenceText}</Text>
            </ScrollView>
          )}
        </View>
      ) : (
        <View style={styles.refEmptyCard}>
          <Ionicons name="scan-outline" size={18} color={Colors.primary} />
          <Text style={styles.refEmptyText}>
            Wala pang OCR text. Mag-scan ng water cycle page para magsimula ang
            mock tutor.
          </Text>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {isInitializing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>
              Inihahanda ang mock tutor... 🧠
            </Text>
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
                      <Text style={styles.avatarText}>🌱</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.bubble,
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

            {isThinking && (
              <View style={[styles.messageRow, styles.rowAi]}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>🧠</Text>
                </View>
                <View
                  style={[
                    styles.bubble,
                    styles.bubbleAi,
                    styles.thinkingBubble,
                  ]}
                >
                  <Text style={styles.teacherName}>Teacher Kahayag</Text>
                  <View style={styles.thinkingRow}>
                    <ActivityIndicator
                      size="small"
                      color={Colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.thinkingText}>
                      Nag-iisip si Teacher...
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
            placeholder="Sumulat ng mensahe..."
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
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
  },
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
  exitBtnText: {
    color: "#fff",
    fontSize: FontSize.xs + 1,
    fontWeight: "800",
  },
  infoBar: {
    backgroundColor: "rgba(40,148,127,0.08)",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  infoText: {
    color: Colors.forest,
    fontSize: FontSize.xs + 1,
    lineHeight: 18,
    fontWeight: "700",
  },
  refCardWrap: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  refHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  refHeaderText: {
    flex: 1,
    fontSize: FontSize.xs + 1,
    fontWeight: "800",
    color: Colors.primary,
    marginLeft: 6,
  },
  refScroll: {
    maxHeight: 120,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  refText: {
    fontSize: FontSize.xs + 1,
    color: Colors.mutedText,
    lineHeight: 18,
    fontStyle: "italic",
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
  },
  refEmptyCard: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refEmptyText: {
    flex: 1,
    color: Colors.mutedText,
    fontSize: FontSize.xs + 1,
    lineHeight: 18,
    fontWeight: "700",
  },
  chatScroll: { flex: 1 },
  chatContent: { padding: Spacing.md, gap: Spacing.md },
  messageRow: { flexDirection: "row", gap: Spacing.sm, maxWidth: "80%" },
  rowAi: { alignSelf: "flex-start" },
  rowUser: { alignSelf: "flex-end", justifyContent: "flex-end" },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.muted,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  avatarText: { fontSize: 20 },
  bubble: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleAi: {
    backgroundColor: "#fff",
    borderTopLeftRadius: Radius.sm,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.sm,
  },
  teacherName: {
    fontSize: FontSize.xs - 1,
    fontWeight: "900",
    color: Colors.teal,
    marginBottom: 4,
  },
  messageText: { fontSize: FontSize.sm + 1, lineHeight: 22 },
  textAi: { color: Colors.forest, fontWeight: "500" },
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
  thinkingBubble: { opacity: 0.95 },
  thinkingRow: { flexDirection: "row", alignItems: "center" },
  thinkingText: {
    fontSize: FontSize.xs + 1,
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
    maxHeight: 100,
    fontSize: FontSize.md,
    color: Colors.forest,
    fontWeight: "600",
    borderWidth: 1.5,
    borderColor: "rgba(40,148,127,0.1)",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
  disabled: { backgroundColor: "rgba(40,148,127,0.3)" },
});
