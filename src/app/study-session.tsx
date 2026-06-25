import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Colors, FontSize, Radius, Spacing } from "../constants/theme";
import {
  checkModelExists,
  downloadModel,
  cancelDownload,
} from "../services/tutor/modelManager";
import { saveStudySession } from "../services/tutor/historyService";
import { useLocalTutor } from "../hooks/useLocalTutor";

export default function StudySessionScreen() {
  const [modelReady, setModelReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [inputVal, setInputVal] = useState("");
  const [showRefText, setShowRefText] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // Check model state on mount
  useEffect(() => {
    let active = true;

    async function checkModel() {
      const exists = await checkModelExists();
      if (active) {
        if (exists) {
          setModelReady(true);
        } else {
          // Trigger download automatically
          handleDownload();
        }
      }
    }

    checkModel();

    return () => {
      active = false;
      cancelDownload();
    };
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      await downloadModel((progress) => {
        setDownloadProgress(progress);
      });
      setModelReady(true);
    } catch (err: any) {
      console.error("[StudySession] Download error:", err);
      setDownloadError(
        "Hindi ma-download ang AI Tutor model. Siguraduhing may internet connection ka para sa unang pag-load."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Connect local LLM tutor hook
  const {
    messages,
    isInitializing,
    isThinking,
    isMockMode,
    sendMessage,
    referenceText,
  } = useLocalTutor();

  // Scroll to bottom on new messages
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
              // Serialize and save the chat history
              if (messages.length > 0) {
                await saveStudySession(referenceText, messages);
              }
            } catch (err) {
              console.error("[StudySession] Error saving history:", err);
            } finally {
              // Back to main screen. Unmount unloads weights.
              router.replace("/(tabs)");
            }
          },
        },
      ]
    );
  };

  // Render model downloader progress view
  if (!modelReady) {
    const percent = Math.round(downloadProgress * 100);
    return (
      <SafeAreaView style={styles.downloadSafe}>
        <View style={styles.downloadContainer}>
          <View style={styles.downloadCard}>
            <Text style={styles.tutorEmoji}>🌱</Text>
            <Text style={styles.downloadTitle}>Inihahanda ang AI Tutor...</Text>
            <Text style={styles.downloadSub}>
              Idina-download ang isip ng AI para magamit offline. Isang beses lang ito gagawin!
            </Text>

            {downloadError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={32} color="#D32F2F" />
                <Text style={styles.errorText}>{downloadError}</Text>
                <Pressable onPress={handleDownload} style={styles.retryBtn}>
                  <Text style={styles.retryText}>Subukan Ulit</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.progressWrap}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[styles.progressBarFill, { width: `${percent}%` }]}
                  />
                </View>
                <Text style={styles.progressPct}>{percent}%</Text>
              </View>
            )}

            <Text style={styles.tipsText}>
              💡 Tip: Huwag isara ang app habang nag-a-update para hindi maantala ang iyong AI Tutor.
            </Text>

            <Pressable
              onPress={() => {
                cancelDownload();
                router.back();
              }}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Bumalik</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
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

      {/* Scanned Reference Text Card */}
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
              {showRefText ? "Itago ang Binabasang Teksto 📖" : "Tignan ang Binabasang Teksto 📖"}
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
      ) : null}

      {/* Main Chat Interface */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {isInitializing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Inihahanda ang isip ng AI... 🧠</Text>
            {isMockMode && <Text style={styles.modeIndicator}>Mock Fallback Enabled</Text>}
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
                    <Text style={[styles.messageText, isAi ? styles.textAi : styles.textUser]}>
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
                <View style={[styles.bubble, styles.bubbleAi, styles.thinkingBubble]}>
                  <Text style={styles.teacherName}>Teacher Kahayag</Text>
                  <View style={styles.thinkingRow}>
                    <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.thinkingText}>Nag-iisip si Teacher...</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Text Input Footer */}
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

  // Reference Scanned text styles
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

  // Chat window styles
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
  modeIndicator: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.yellow,
    backgroundColor: Colors.forest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginTop: 4,
  },

  thinkingBubble: { opacity: 0.95 },
  thinkingRow: { flexDirection: "row", alignItems: "center" },
  thinkingText: {
    fontSize: FontSize.xs + 1,
    color: Colors.mutedText,
    fontStyle: "italic",
    fontWeight: "700",
  },

  // Text Input bar styles
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
    paddingVertical: 8,
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

  // Download view styles
  downloadSafe: { flex: 1, backgroundColor: Colors.background },
  downloadContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  downloadCard: {
    backgroundColor: "#fff",
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    width: "100%",
  },
  tutorEmoji: { fontSize: 64, marginBottom: Spacing.sm },
  downloadTitle: {
    fontSize: FontSize.xl,
    fontWeight: "900",
    color: Colors.forest,
    textAlign: "center",
    marginBottom: 8,
  },
  downloadSub: {
    fontSize: FontSize.sm,
    color: Colors.mutedText,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  progressWrap: { width: "100%", alignItems: "center", gap: 8, marginBottom: Spacing.md },
  progressBarBg: {
    width: "100%",
    height: 12,
    backgroundColor: Colors.muted,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  progressPct: { fontSize: FontSize.md, fontWeight: "900", color: Colors.primary },
  tipsText: {
    fontSize: FontSize.xs,
    color: Colors.mutedText,
    textAlign: "center",
    lineHeight: 16,
    fontStyle: "italic",
    marginBottom: Spacing.lg,
  },
  cancelBtn: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  cancelBtnText: {
    color: Colors.mutedText,
    fontWeight: "700",
    fontSize: FontSize.sm,
  },
  errorContainer: {
    width: "100%",
    alignItems: "center",
    marginVertical: Spacing.md,
    gap: 8,
  },
  errorText: {
    fontSize: FontSize.xs + 1,
    color: "#D32F2F",
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "700",
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.md,
    marginTop: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: FontSize.sm,
  },
});
