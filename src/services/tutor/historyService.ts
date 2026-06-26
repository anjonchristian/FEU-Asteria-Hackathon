import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Message {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  scannedText: string;
  timestamp: string;
  messages: Message[];
}

const STORAGE_KEY = "KAHAYAG_STUDY_HISTORY";

export async function saveStudySession(
  scannedText: string,
  messages: Message[],
): Promise<ChatSession> {
  try {
    const rawSessions = await AsyncStorage.getItem(STORAGE_KEY);
    const sessions: ChatSession[] = rawSessions ? JSON.parse(rawSessions) : [];

    // Create a child-friendly title from the first few words of scanned text
    const cleanTextSnippet = scannedText
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    let title = cleanTextSnippet.split(" ").slice(0, 4).join(" ");
    if (title.length < cleanTextSnippet.length) {
      title += "...";
    }
    if (!title || title.trim() === "...") {
      title = "Aralin - " + new Date().toLocaleDateString();
    }

    const newSession: ChatSession = {
      id: Math.random().toString(36).substring(7) + Date.now().toString(36),
      title,
      scannedText,
      timestamp: new Date().toISOString(),
      // Filter out system messages from history to keep it clean and child-readable
      messages: messages.filter((m) => m.role !== "system"),
    };

    sessions.unshift(newSession); // Most recent first
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return newSession;
  } catch (error) {
    console.error("[HistoryService] Error saving study session:", error);
    throw error;
  }
}

export async function getStudySessions(): Promise<ChatSession[]> {
  try {
    const rawSessions = await AsyncStorage.getItem(STORAGE_KEY);
    return rawSessions ? JSON.parse(rawSessions) : [];
  } catch (error) {
    console.error("[HistoryService] Error getting study sessions:", error);
    return [];
  }
}

export async function clearStudyHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("[HistoryService] Error clearing study history:", error);
  }
}
