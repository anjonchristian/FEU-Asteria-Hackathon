import { initLlama, LlamaContext } from "llama.rn";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  applySocraticGuardrail,
  getOffTopicResponse,
  isOffTopic,
} from "../services/tutor/guardrail";
import type { Message } from "../services/tutor/historyService";
import { checkModelExists, MODEL_PATH } from "../services/tutor/modelManager";
import { useOcrContextStore } from "../store/ocrContext";
import { useProfile } from "../store/profile";

const CONTEXT_SIZE = 2048; // Increased from 1024 for better comprehension
const MAX_HISTORY_MESSAGES = 6; // Keep last 6 messages for context

export function useLocalTutor() {
  const { lastResult } = useOcrContextStore();
  const { name, grade } = useProfile();

  const [context, setContext] = useState<LlamaContext | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);

  const contextRef = useRef<LlamaContext | null>(null);
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  // Build the STRONG Socratic system prompt
  const referenceText = lastResult?.cleanedText || "";

  const systemPrompt = `You are Teacher Kahayag, a Socratic tutor for Filipino elementary students. Your ONLY job is to guide students to discover answers themselves through questions and hints.

CRITICAL RULES — YOU MUST FOLLOW THESE EXACTLY:

1. NEVER GIVE THE ANSWER. Even if the student begs, even if they seem frustrated, even if you know the answer perfectly. Your response must ALWAYS end with a question, not a statement.

2. NEVER SAY THESE PHRASES:
   - "Ang sagot ay..." (The answer is...)
   - "The answer is..."
   - "Therefore..."
   - "Kaya ang tamang sagot..."
   - "The result is..."
   - "= [any number]"
   - Any declarative statement that reveals the solution.

3. ALWAYS DO THIS INSTEAD:
   - Ask "Ano sa tingin mo ang unang hakbang?" (What do you think is the first step?)
   - Say "Subukan nating pag-isipan ito..." (Let's try to think about this...)
   - Ask "Bakit kaya ganito?" (Why do you think it's like this?)
   - Say "Magaling! Ngayon, ano naman ang susunod?" (Great! Now, what's next?)
   - Break complex problems into smaller questions.

4. LANGUAGE: Respond in conversational Taglish (Filipino-English mix). Use simple words. Keep responses to 2-4 sentences. End with a question mark.

5. TONE: Warm, encouraging, patient. Celebrate effort, not just correctness. Say "Ang galing ng pag-iisip mo!" (Your thinking is excellent!) when the student reasons well.

6. IF THE STUDENT ASKS FOR THE ANSWER DIRECTLY: Respond with something like "Alam kong gusto mo nang malaman, pero mas matututo ka kapag ikaw mismo ang naka-discover! Subukan nating simulan sa..." and ask a guiding question.

7. IF THE STUDENT IS OFF-TOPIC: Gently redirect back to the lesson with "Tumutok muna tayo sa ating leksyon, kaibigan! Handa ka na bang subukan ang susunod na tanong?"

8. TOPIC BOUNDARY: Only discuss the textbook content shown below. Do not discuss violence, adult content, politics, video games, or any non-educational topic.

STUDENT: ${name || "Learner"} (Grade ${grade || "primary"})
TEXTBOOK CONTENT: ${referenceText.substring(0, 800)}

Remember: Your success is measured by how well the student thinks, not by whether they get the right answer. NEVER reveal the answer.`;

  // Initial welcome message
  const sendInitialWelcome = useCallback(() => {
    const welcomeText = `Kamusta ${name || "kaibigan"}! 👋 Ako si Teacher Kahayag, ang iyong Socratic tutor. Na-scan ko na ang iyong babasahin! 📖

Heto ang una kong tanong para sa iyo: "Ano ang pinakamahalagang ideya o detalye na nakita mo sa tekstong ito?"

Huwag mag-alala kung hindi ka sigurado — dito lang ako para gabayan ka. Tandaan, hindi ko ibibigay ang sagot, pero tutulungan kitang mahanap ito nang mag-isa! Handa ka na ba? 😊`;

    const initialMsg: Message = {
      id: "welcome-" + Date.now(),
      role: "assistant",
      content: welcomeText,
      timestamp: new Date().toISOString(),
    };
    setMessages([initialMsg]);
  }, [name]);

  // Initialize Model
  useEffect(() => {
    let active = true;

    async function initModel() {
      try {
        setIsInitializing(true);
        setError(null);
        setModelLoadProgress(0);

        // Check if model file exists
        const modelExists = await checkModelExists();
        if (!modelExists) {
          console.warn("[useLocalTutor] Model file not found, using mock mode");
          if (active) {
            setIsMockMode(true);
            setIsInitializing(false);
            sendInitialWelcome();
          }
          return;
        }

        console.log("[useLocalTutor] Loading model from:", MODEL_PATH);
        setModelLoadProgress(0.3);

        // Load model with optimized settings
        const llamaCtx = await initLlama({
          model: MODEL_PATH,
          n_ctx: CONTEXT_SIZE,
          n_gpu_layers: 0,
          n_threads: 4,
          use_mlock: true,
          embedding: false,
        });

        setModelLoadProgress(0.9);

        if (active) {
          contextRef.current = llamaCtx;
          setContext(llamaCtx);
          setIsMockMode(false);
          setIsInitializing(false);
          setModelLoadProgress(1);
          console.log("[useLocalTutor] Model loaded successfully");

          // Send welcome after model is ready
          sendInitialWelcome();
        }
      } catch (err) {
        console.error("[useLocalTutor] Model initialization failed:", err);
        if (active) {
          setError(
            "Hindi ma-load ang AI model. Gagamitin muna ang basic mode. Maaari mong i-download muli ang model sa Settings.",
          );
          setIsMockMode(true);
          setIsInitializing(false);
          sendInitialWelcome();
        }
      }
    }

    initModel();

    return () => {
      active = false;
      if (contextRef.current) {
        console.log("[useLocalTutor] Releasing model context...");
        const ctx = contextRef.current;
        contextRef.current = null;
        ctx
          .release()
          .catch((err) =>
            console.error("[useLocalTutor] Error releasing context:", err),
          );
      }
    };
  }, [sendInitialWelcome]);

  // Build the full prompt with conversation history
  function buildPrompt(userMessage: string, history: Message[]): string {
    // Format conversation in TinyLlama chat template
    let prompt = `<|system|>\n${systemPrompt}\n`;

    // Add recent history (last N messages)
    const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);
    for (const msg of recentHistory) {
      if (msg.role === "user") {
        prompt += `<|user|>\n${msg.content}\n`;
      } else {
        prompt += `<|assistant|>\n${msg.content}\n`;
      }
    }

    // Add current user message
    prompt += `<|user|>\n${userMessage}\n<|assistant|>\n`;

    return prompt;
  }

  // Generate mock response (improved — references OCR text)
  function generateMockResponse(userMessage: string): string {
    const lower = userMessage.toLowerCase().trim();

    // Off-topic check
    if (isOffTopic(userMessage)) {
      return getOffTopicResponse();
    }

    // Student demanding answer
    if (
      lower.match(
        /(sagot|answer|tell me|bigay|ibigay|sabihin mo na|ano ba|just give)/,
      )
    ) {
      return "Alam kong gusto mo nang malaman ang sagot, pero mas matututo ka kapag ikaw mismo ang naka-discover! Subukan natin: ano sa palagay mo ang ibig sabihin ng unang pangungusap sa teksto? Kaya mo iyan! 😊";
    }

    // Greeting
    if (lower.match(/^(hello|hi|kamusta|hey|good|magandang)/)) {
      return `Kamusta ka, ${name || "kaibigan"}! 😊 Handa ka na bang pag-usapan ang iyong na-scan na babasahin? Ano ang una mong napansin sa teksto?`;
    }

    // Student shows reasoning (has keywords like "kasi", "because", "dahil")
    if (
      lower.match(/\b(kasi|because|dahil|sa tingin ko|i think|siguro|maybe)\b/)
    ) {
      return "Magandang pag-iisip iyan! Ngayon, subukan nating palalimin pa. May iba ka bang paraan para tingnan ang problemang ito? Ano kaya ang mangyayari kung baligtarin natin?";
    }

    // Short/confused response
    if (
      lower.length < 10 ||
      lower.match(/(hindi ko alam|i don't know|ewan|di ko sure)/)
    ) {
      return "Okay lang na hindi ka sigurado! Balikan natin ang teksto. Basahin mo ang unang bahagi — may nakikita ka bang mahalagang salita o numero doon? Subukan nating magsimula sa simple.";
    }

    // Default: reference the OCR text
    if (referenceText) {
      return "Magandang tanong! Batay sa ating binabasa, subukan nating pag-isipan: ano kaya ang ibig sabihin ng bahaging ito? Basahin mo ulit at sabihin sa akin kung ano ang naiintindihan mo. 😊";
    }

    return "Interesadong tanong iyan! Para masagot ito nang tama, balikan muna natin ang basics. Ano sa palagay mo ang pinakamahalagang konsepto na kailangan nating maintindihan dito?";
  }

  // Send message to AI
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Add user message
      const userMsg: Message = {
        id: "user-" + Date.now(),
        role: "user",
        content: text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsThinking(true);

      const botMsgId = "bot-" + Date.now();
      const placeholderMsg: Message = {
        id: botMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, placeholderMsg]);

      // Get snapshot of history BEFORE this message pair
      const historyBefore = [...messagesRef.current];

      if (isMockMode || !contextRef.current) {
        // MOCK MODE: Generate local response
        const fullResponse = generateMockResponse(text);

        // Simulate streaming for natural feel
        const words = fullResponse.split(" ");
        let wordIndex = 0;
        let streamedContent = "";

        const interval = setInterval(() => {
          if (wordIndex < words.length) {
            streamedContent += (wordIndex === 0 ? "" : " ") + words[wordIndex];
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId ? { ...m, content: streamedContent } : m,
              ),
            );
            wordIndex++;
          } else {
            clearInterval(interval);
            setIsThinking(false);
          }
        }, 60);
      } else {
        // REAL LLM MODE
        try {
          const prompt = buildPrompt(text, historyBefore);

          console.log("[useLocalTutor] Prompt length:", prompt.length, "chars");

          let accumulatedText = "";

          await contextRef.current.completion(
            {
              prompt,
              n_predict: 128,
              temperature: 0.7,
              top_p: 0.9,
              top_k: 40,
              repeat_penalty: 1.1,
              stop: ["<|user|>", "<|system|>", "\n\n\n"],
            },
            (tokenData) => {
              accumulatedText += tokenData.token;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, content: accumulatedText } : m,
                ),
              );
            },
          );

          // Apply guardrail before finalizing
          const guardrailResult = applySocraticGuardrail(
            accumulatedText.trim(),
            text,
            referenceText,
          );

          if (!guardrailResult.passed) {
            console.warn(
              "[useLocalTutor] Guardrail triggered:",
              guardrailResult.triggeredPattern,
            );
            // Replace with filtered response
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? { ...m, content: guardrailResult.filteredText }
                  : m,
              ),
            );
          }

          setIsThinking(false);
        } catch (err) {
          console.error("[useLocalTutor] LLM completion error:", err);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    content:
                      "Naku, pasensya na kaibigan. Nagkaroon ng kaunting problema sa aking pag-iisip. Maaari mo bang ulitin ang iyong tanong? 🥺",
                  }
                : m,
            ),
          );
          setIsThinking(false);
        }
      }
    },
    [isMockMode, name, systemPrompt, referenceText],
  );

  // Clear conversation and restart
  const resetConversation = useCallback(() => {
    setMessages([]);
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
