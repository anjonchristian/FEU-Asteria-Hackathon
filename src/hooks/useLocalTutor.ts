import { useCallback, useEffect, useState } from "react";

import type { Message } from "../services/tutor/historyService";
import { getMockResponse } from "../services/tutor/mockConversation";
import { useOcrContextStore } from "../store/ocrContext";
import { useProfile } from "../store/profile";

const MOCK_WATER_CYCLE_HINT =
  "Para sa mock demo na ito, water cycle lang muna ang supported. Pwede mo bang i-scan ang page tungkol sa water cycle para masimulan natin? 😊";

const MOCK_NO_TEXT_HINT =
  "Mukhang wala pa akong nakikitang scanned text mula sa OCR. Pwede mo bang i-scan muna ang water cycle page para masabayan kita? 😊";

export function useLocalTutor() {
  const { lastResult } = useOcrContextStore();
  const { name } = useProfile();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [error] = useState<string | null>(null);
  const [isMockMode] = useState(true);
  const [modelLoadProgress] = useState(1);

  const referenceText = lastResult?.cleanedText || "";

  const sendInitialWelcome = useCallback(() => {
    const welcomeText = referenceText
      ? `Kamusta ${name || "kaibigan"}! 👋 Na-scan ko na ang iyong babasahin. 📖\n\nHeto ang una kong tanong para sa iyo: ano ang napansin mo sa water cycle text?`
      : `Kamusta ${name || "kaibigan"}! 👋 Handa akong gumamit ng mock water cycle tutor, pero kailangan muna nating makita ang scanned text. Pwede mo bang i-scan ang water cycle page? 📖`;

    const initialMsg: Message = {
      id: "welcome-" + Date.now(),
      role: "assistant",
      content: welcomeText,
      timestamp: new Date().toISOString(),
    };

    setMessages([initialMsg]);
  }, [name, referenceText]);

  useEffect(() => {
    sendInitialWelcome();
    setIsInitializing(false);
  }, [sendInitialWelcome]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: Message = {
        id: "user-" + Date.now(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };

      const botMsgId = "bot-" + Date.now();
      const placeholderMsg: Message = {
        id: botMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg, placeholderMsg]);
      setIsThinking(true);

      const response = buildMockWaterCycleResponse(text, referenceText);
      const words = response.split(" ");
      let wordIndex = 0;
      let streamedContent = "";

      const interval = setInterval(() => {
        if (wordIndex < words.length) {
          streamedContent += (wordIndex === 0 ? "" : " ") + words[wordIndex];
          setMessages((prev) =>
            prev.map((message) =>
              message.id === botMsgId
                ? { ...message, content: streamedContent }
                : message,
            ),
          );
          wordIndex++;
        } else {
          clearInterval(interval);
          setIsThinking(false);
        }
      }, 60);
    },
    [referenceText],
  );

  const resetConversation = useCallback(() => {
    sendInitialWelcome();
  }, [sendInitialWelcome]);

  return {
    messages,
    isInitializing,
    isThinking,
    isMockMode,
    error,
    modelLoadProgress,
    sendMessage,
    resetConversation,
    referenceText,
  };
}

function buildMockWaterCycleResponse(
  userMessage: string,
  referenceText: string,
): string {
  const normalizedReference = referenceText.toLowerCase();

  if (!normalizedReference) {
    return MOCK_NO_TEXT_HINT;
  }

  const isWaterCycleLesson =
    /water cycle|evaporation|condensation|precipitation/i.test(
      normalizedReference,
    );

  if (!isWaterCycleLesson) {
    return MOCK_WATER_CYCLE_HINT;
  }

  return getMockResponse(userMessage);
}
