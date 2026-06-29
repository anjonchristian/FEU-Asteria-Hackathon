import { GoogleGenerativeAI } from "@google/generative-ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { SUBJECTS } from "../constants/data";
import {
  applySocraticGuardrail,
  getOffTopicResponse,
  isOffTopic,
} from "../services/tutor/guardrail";
import type { Message } from "../services/tutor/historyService";
import { useProfile } from "../store/profile";

export function useLocalTutor(subjectId?: string) {
  const { name, grade, language } = useProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isThinking, setIsThinking] = useState(false);

  const chatRef = useRef<any>(null);
  const subjectLabel =
    SUBJECTS.find((s) => s.id === subjectId)?.label || "General Studies";

  const sendInitialWelcome = useCallback(() => {
    const welcomeText = language === "fil"
      ? `Kamusta ${name || "kaibigan"}! Ako si Teacher Kahayag. Handa na ba tayong mag-aral ng ${subjectLabel} ngayon? Ano ang gusto mong pag-usapan?`
      : `Hello ${name || "friend"}! I am Teacher Kahayag. Are we ready to learn ${subjectLabel} today? What do you want to talk about?`;

    const initialMsg: Message = {
      id: "welcome-" + Date.now(),
      role: "assistant",
      content: welcomeText,
      timestamp: new Date().toISOString(),
    };
    setMessages([initialMsg]);
  }, [name, subjectLabel, language]);

  useEffect(() => {
    const initChat = async () => {
      const genAI = new GoogleGenerativeAI(
        process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "",
      );

      // LAYER 1: STRICT SYSTEM INSTRUCTION
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction:
          `You are Teacher Kahayag, a friendly and encouraging tutor for a ${grade} student named ${name}. You are tutoring them in ${subjectLabel} under the Philippine DepEd MATATAG Curriculum.\n\n` +
          `TEACHING GUIDELINES:\n` +
          `1. When the student asks to LEARN or UNDERSTAND a concept (e.g., "What is evaporation?", "Explain photosynthesis"), TEACH THEM clearly with simple explanations, examples, and analogies. It is your job to help them learn!\n` +
          `2. When the student asks you to SOLVE a specific problem or exercise for them (e.g., "What is 24 × 3?", "What is the answer to #5?"), do NOT give the direct answer. Instead, give a helpful hint, break the problem into smaller steps, or ask a guiding question so they can work it out.\n` +
          `3. If the student says "I don't know" to a problem, give a bigger hint or simplify the problem — don't just repeat the question.\n` +
          `4. Keep responses concise (2-4 sentences), encouraging, child-friendly, and use conversational ${language === "fil" ? "Taglish" : "English"} with emojis.\n` +
          `5. STRICT SUBJECT ENFORCEMENT: You are ONLY allowed to discuss and answer questions related to ${subjectLabel}. If the student asks about any other subject or completely off-topic matters (e.g., video games, different subjects), politely refuse to answer, remind them that this is a ${subjectLabel} session, and redirect them back to the topic.`,
      });

      chatRef.current = model.startChat({ history: [] });
      sendInitialWelcome();
      setIsInitializing(false);
    };

    initChat();
  }, [grade, name, subjectLabel, language, sendInitialWelcome]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !chatRef.current) return;

    const userMsg: Message = {
      id: "user-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    // LAYER 2: PRE-GENERATION OFF-TOPIC CHECK
    if (isOffTopic(text)) {
      const offTopicMsg: Message = {
        id: "bot-" + Date.now(),
        role: "assistant",
        content: getOffTopicResponse(),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, offTopicMsg]);
      setIsThinking(false);
      return;
    }

    try {
      const result = await chatRef.current.sendMessage(text);
      let responseText = result.response.text();

      // LAYER 3: POST-GENERATION SOCRATIC INTERCEPTOR
      // We pass an empty string for textbookContext since we are doing direct chat
      const guardrailResult = applySocraticGuardrail(responseText, text, "");

      if (!guardrailResult.passed) {
        console.warn(
          "[Tutor] AI tried to give a direct answer. Guardrail intercepted it.",
        );
        responseText = guardrailResult.filteredText;
      }

      const botMsg: Message = {
        id: "bot-" + Date.now(),
        role: "assistant",
        content: responseText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Gemini Tutor Error:", error);
      const errorMsg: Message = {
        id: "bot-" + Date.now(),
        role: "assistant",
        content:
          "Pasensya na, medyo nahirapan akong intindihin iyon. Pwede mo bang ulitin?",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  }, []);

  const resetConversation = useCallback(() => {
    chatRef.current = null;
    sendInitialWelcome();
  }, [sendInitialWelcome]);

  return {
    messages,
    isInitializing,
    isThinking,
    sendMessage,
    resetConversation,
    referenceText: "",
  };
}
