/**
 * Quiz generation service backed by a local quantized SLM via llama.rn.
 *
 * Design principles for 4-bit models:
 *  - One-shot compact JSON example in the system prompt removes format ambiguity.
 *  - "JSON:" at the end of the user prompt primes the model to open the array.
 *  - Temperature 0.15 keeps output deterministic and schema-compliant.
 *  - n_predict is capped tightly — 5 questions need ~700 tokens at most.
 *  - Robust post-processing handles the common failure modes of quantized models:
 *    markdown fences, preamble prose, trailing commas, truncated arrays.
 *  - One automatic retry with a stricter repair prompt if the first parse fails.
 */

import type { LlamaContext } from "llama.rn";
import type { Deck, Flashcard } from "../../store/vault";

// ─── Prompt templates ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a quiz generator. Output ONLY a valid JSON array.
No markdown. No explanations. No text before or after the array.

EXACT FORMAT:
[{"question":"What is X?","options":["A","B","C","D"],"answer":"A"},{"question":"What is Y?","options":["E","F","G","H"],"answer":"F"}]

Rules:
- Every object must have: question (string), options (array of EXACTLY 4 strings), answer (must be one of the 4 options verbatim)
- Start your response with [
- End your response with ]`;

function buildUserPrompt(text: string, count: number): string {
  return (
    `Generate exactly ${count} multiple-choice questions from this text.\n\n` +
    `TEXT:\n${text.slice(0, 3000)}\n\n` + // Hard-cap to stay within KV budget
    `JSON:`
  );
}

function buildRetryPrompt(
  text: string,
  count: number,
  partialOutput: string,
): string {
  return (
    `Fix and complete this malformed JSON quiz array (${count} questions) ` +
    `about the text below. Output ONLY the corrected JSON array.\n\n` +
    `TEXT:\n${text.slice(0, 2000)}\n\n` +
    `MALFORMED OUTPUT TO FIX:\n${partialOutput.slice(0, 800)}\n\n` +
    `CORRECTED JSON:`
  );
}

// ─── JSON extraction & repair ─────────────────────────────────────────────────

/**
 * Strips markdown fences and extracts the outermost [...] boundaries.
 */
function extractJsonArray(raw: string): string {
  let s = raw.trim();

  // Strip ` ```json ` or ` ``` ` fences
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");

  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");

  if (start === -1 || end === -1 || end <= start) {
    throw new SyntaxError("No JSON array boundaries found in model output.");
  }

  return s.slice(start, end + 1);
}

/**
 * Structural repairs only — never alters content.
 * Handles the most common quantized-model JSON pathologies.
 */
function repairJson(s: string): string {
  return (
    s
      // Remove BOM
      .replace(/^﻿/, "")
      // Remove trailing commas before } or ]
      .replace(/,\s*([}\]])/g, "$1")
      // Replace curly/smart quotes with straight quotes
      .replace(/[""„‟″‶]/g, '"')
      .replace(/[''‚‛′‵]/g, "'")
      // Escape lone backslashes that aren't part of a valid JSON escape
      .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
      // If the array was truncated and has no closing ], close it
      .replace(/,?\s*$/, "]")
  );
}

function parseQuizJson(raw: string): unknown[] {
  const extracted = extractJsonArray(raw);

  // Attempt 1 — straight parse
  try {
    const parsed = JSON.parse(extracted);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fall through
  }

  // Attempt 2 — after structural repair
  const repaired = repairJson(extracted);
  const parsed = JSON.parse(repaired); // Throws if still broken — caller handles it

  if (!Array.isArray(parsed)) {
    throw new TypeError("Parsed JSON is not an array.");
  }
  return parsed;
}

// ─── Card validation ──────────────────────────────────────────────────────────

function validateAndNormalise(item: unknown, index: number): Flashcard | null {
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

  // Pad to exactly 4 if the model gave fewer
  while (options.length < 4) options.push(`Option ${options.length + 1}`);

  const card: Flashcard = {
    id: `card-${Date.now()}-${index}`,
    question,
    options: options.slice(0, 4),
    answer,
  };

  if (typeof obj.explanation === "string") {
    card.explanation = obj.explanation;
  }

  return card;
}

// ─── Main export ─────────────────────────────────────────────────────────────

const BASE_PARAMS = {
  temperature: 0.15, // Near-deterministic for structured output
  top_k: 40,
  top_p: 0.9,
  penalty_repeat: 1.1,
} as const;

export async function generateQuizFromText(
  llama: LlamaContext,
  text: string,
  subjectId: string = "general",
  itemCount: number = 5,
): Promise<Deck> {
  // ~200 tokens per Q&A object, plus overhead for prompt and preamble
  const nPredict = Math.min(itemCount * 200 + 256, 1200);

  let rawOutput = "";

  // ── First attempt ────────────────────────────────────────────────────────
  try {
    const response = await llama.completion({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(text, itemCount) },
      ],
      n_predict: nPredict,
      ...BASE_PARAMS,
    });

    rawOutput = response.text ?? "";
    const cards = parseAndValidate(rawOutput, itemCount);
    return buildDeck(cards, subjectId);
  } catch (firstErr) {
    console.warn("[QuizGenerator] First attempt failed:", firstErr);
  }

  // ── Retry with stricter repair prompt ────────────────────────────────────
  try {
    const response = await llama.completion({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildRetryPrompt(text, itemCount, rawOutput) },
      ],
      n_predict: nPredict,
      temperature: 0.05, // Even more deterministic on retry
      top_k: 20,
      top_p: 0.85,
      penalty_repeat: 1.1,
    });

    const cards = parseAndValidate(response.text ?? "", itemCount);
    return buildDeck(cards, subjectId);
  } catch (retryErr) {
    console.error("[QuizGenerator] Retry also failed:", retryErr);
    throw new Error(
      "The on-device model could not produce a valid quiz. " +
        "Try scanning clearer or shorter text.",
    );
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseAndValidate(raw: string, minCards: number): Flashcard[] {
  const parsed = parseQuizJson(raw);

  const cards: Flashcard[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const card = validateAndNormalise(parsed[i], i);
    if (card) cards.push(card);
  }

  if (cards.length === 0) {
    throw new Error(
      `No valid cards after validation. Raw output: ${raw.slice(0, 300)}`,
    );
  }

  if (cards.length < minCards) {
    console.warn(
      `[QuizGenerator] Requested ${minCards} cards, produced ${cards.length}.`,
    );
  }

  return cards;
}

function buildDeck(cards: Flashcard[], subjectId: string): Deck {
  return {
    id: `deck-${Date.now()}`,
    title: `Quiz · ${new Date().toLocaleDateString()}`,
    subjectId,
    createdAt: new Date().toISOString(),
    cards,
  };
}
