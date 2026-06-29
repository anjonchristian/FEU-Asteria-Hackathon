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
  subjectId?: string; // Add this field
}

const STORAGE_KEY = "KAHAYAG_STUDY_HISTORY";

export async function saveStudySession(
  scannedText: string,
  messages: Message[],
  subjectId?: string, // Add this parameter
): Promise<ChatSession> {
  try {
    const rawSessions = await AsyncStorage.getItem(STORAGE_KEY);
    const sessions: ChatSession[] = rawSessions ? JSON.parse(rawSessions) : [];

    // Derive the title from the first user message (the topic they discussed)
    const firstUserMsg = messages.find((m) => m.role === "user");
    let title: string;

    if (firstUserMsg) {
      const cleanTopic = firstUserMsg.content
        .replace(/[\r\n\t]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      // Use up to ~60 chars of the first user message as the title
      if (cleanTopic.length > 60) {
        title = cleanTopic.substring(0, 57) + "...";
      } else {
        title = cleanTopic;
      }
    } else {
      // Fallback: use scanned text snippet
      const cleanTextSnippet = scannedText
        .replace(/[\r\n\t]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      title = cleanTextSnippet.split(" ").slice(0, 6).join(" ");
      if (title.length < cleanTextSnippet.length) {
        title += "...";
      }
    }

    if (!title || title.trim() === "..." || title.trim() === "") {
      title = "Aralin - " + new Date().toLocaleDateString();
    }

    const newSession: ChatSession = {
      id: Math.random().toString(36).substring(7) + Date.now().toString(36),
      title,
      scannedText,
      timestamp: new Date().toISOString(),
      messages: messages.filter((m) => m.role !== "system"),
      subjectId, // Tag the session
    };

    sessions.unshift(newSession);
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
