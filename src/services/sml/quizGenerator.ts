import { LlamaContext } from "llama.rn"; // Adjust based on your llama.rn setup
import { Deck, Flashcard } from "../../store/vault";

const QUIZ_SYSTEM_PROMPT = `You are an expert teacher creating a multiple-choice quiz based on the provided text.
You MUST respond ONLY with a valid JSON array. Do not include any conversational text, markdown formatting, or explanations.
Output EXACTLY in this format:
[
  {
    "question": "Sample question based on text?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "answer": "Option 1"
  }
]`;

export async function generateQuizFromText(
  llama: LlamaContext,
  text: string,
  subjectId: string = "general",
  itemCount: number = 5,
): Promise<Deck> {
  const userPrompt = `Create a ${itemCount}-item multiple choice quiz from this text:\n\n"${text}"\n\nOutput ONLY valid JSON.`;

  try {
    // 1. Call the local SLM
    const response = await llama.completion({
      messages: [
        { role: "system", content: QUIZ_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      n_predict: 1024,
      temperature: 0.3, // Low temperature for more deterministic/structured output
      top_k: 40,
      top_p: 0.9,
    });

    const rawOutput = response.text;

    // 2. Safely extract JSON (Quantized SLMs sometimes add trailing/leading characters)
    const jsonMatch = rawOutput.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      throw new Error("SLM did not return a valid JSON array.");
    }

    // 3. Parse and validate
    const parsedCards: Flashcard[] = JSON.parse(jsonMatch[0]);

    // Ensure the generated objects match our Flashcard interface
    const validCards = parsedCards
      .filter((c) => c.question && Array.isArray(c.options) && c.answer)
      .map((c, index) => ({
        id: `card-${Date.now()}-${index}`,
        question: c.question,
        options: c.options,
        answer: c.answer,
      }));

    if (validCards.length === 0) {
      throw new Error("No valid flashcards were parsed.");
    }

    // 4. Construct the Deck
    const newDeck: Deck = {
      id: `deck-${Date.now()}`,
      title: `Generated Quiz (${new Date().toLocaleDateString()})`,
      subjectId: subjectId,
      createdAt: new Date().toISOString(),
      cards: validCards,
    };

    return newDeck;
  } catch (error) {
    console.error("[SLM Quiz Generator] Failed:", error);
    throw error;
  }
}
