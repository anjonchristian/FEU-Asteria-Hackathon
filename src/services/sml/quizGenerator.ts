import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Deck, Flashcard } from "../../store/vault";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const SYSTEM_PROMPT = `You are a quiz generator. Output ONLY a valid JSON array. No markdown. No explanations. No text before or after the array. EXACT FORMAT: [{"question":"What is X?","options":["A","B","C","D"],"answer":"A"}] Rules: - Every object must have: question (string), options (array of EXACTLY 4 strings), answer (must be one of the 4 options verbatim) - Start your response with [ - End your response with ]`;

function parseQuizJson(raw: string): unknown[] {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array found");
  s = s.slice(start, end + 1).replace(/,\s*([}\]])/g, "$1");
  const parsed = JSON.parse(s);
  if (!Array.isArray(parsed)) throw new Error("Not an array");
  return parsed;
}

function validateCard(item: unknown, index: number): Flashcard | null {
  if (typeof item !== "object" || item === null) return null;
  const obj = item as Record<string, unknown>;
  const question = typeof obj.question === "string" ? obj.question.trim() : "";
  const answer = typeof obj.answer === "string" ? obj.answer.trim() : "";
  const options = Array.isArray(obj.options)
    ? (obj.options as unknown[])
        .filter((o): o is string => typeof o === "string")
        .map((o) => o.trim())
    : [];
  if (!question || options.length < 2 || !answer) return null;
  if (!options.includes(answer)) return null;
  while (options.length < 4) options.push(`Option ${options.length + 1}`);
  return {
    id: `card-${Date.now()}-${index}`,
    question,
    options: options.slice(0, 4),
    answer,
  };
}

export async function generateQuizFromText(
  _llama: unknown,
  text: string,
  subjectId: string = "general",
  itemCount: number = 5,
  language: string = "en",
): Promise<Deck> {
  const prompt =
    `${SYSTEM_PROMPT}\n\nGenerate exactly ${itemCount} multiple-choice questions from this text. ` +
    `Write the questions and options in ${language === "fil" ? "Tagalog/Filipino" : "English"}.\n\n` +
    `TEXT:\n${text.slice(0, 3000)}\n\nJSON:`;
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const parsed = parseQuizJson(raw);
  const cards: Flashcard[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const card = validateCard(parsed[i], i);
    if (card) cards.push(card);
  }
  if (cards.length === 0) throw new Error("No valid cards generated.");
  return {
    id: `deck-${Date.now()}`,
    title: `Quiz - ${new Date().toLocaleDateString()}`,
    subjectId,
    createdAt: new Date().toISOString(),
    cards,
  };
}

// --- NEW FUNCTION ADDED HERE ---
export async function generateAssessmentQuiz(
  grade: string,
  subjects: string[],
  itemCount: number = 10,
  language: string = "en",
): Promise<Flashcard[]> {
  const subjectList =
    subjects.length > 0 ? subjects.join(", ") : "general elementary subjects";

  const prompt =
    `${SYSTEM_PROMPT}\n\n` +
    `Generate exactly ${itemCount} multiple-choice questions for a student in ${grade} following the Philippines DepEd MATATAG Curriculum.\n\n` +
    `Focus specifically on these subjects: ${subjectList}.\n\n` +
    `Ensure the difficulty is appropriate for the grade level. For Grades 1-3, prioritize foundational literacy, numeracy (Mathematics), Language, Makabansa, and GMRC. For Grades 4-6, expand to include Science, Araling Panlipunan, EPP/TLE, and MAPEH if selected.\n\n` +
    `Write the questions and options in ${language === "fil" ? "Tagalog/Filipino" : "English"}.\n\n` +
    `JSON:`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const parsed = parseQuizJson(raw);

  const cards: Flashcard[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const card = validateCard(parsed[i], i);
    if (card) cards.push(card);
  }

  if (cards.length === 0) throw new Error("No valid questions generated.");

  return cards;
}
