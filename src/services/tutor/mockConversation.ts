/**
 * HOW THE MOCK WORKS
 *
 * 1. This file simulates what the real TinyLlama AI will do once it's working properly.
 * 2. The student scans a textbook page -> OCR extracts text -> student taps "Ask AI Tutor" -> this mock generates responses based on keyword matching.
 * 3. This mock is intentionally water-cycle-specific so it stays isolated from the real generic OCR tutor.
 * 4. To test: scan the water cycle text, then type the trigger phrases listed in each turn.
 * 5. The keyword matching is intentionally simple (string.includes) so it's easy to understand and modify.
 * 6. The 4 turns demonstrate a complete Socratic learning loop: observation -> guided discovery -> connection -> mastery celebration.
 */

type TurnResponse = {
  triggers: string[];
  response: string;
};

const TURN_1_RESPONSE =
  "Magandang napansin mo, kaibigan! 😊 Kung tungkol nga ito sa water cycle, subukan nating tingnan ang unang stage: saan kaya napupunta ang tubig kapag nag-e-evaporate?";

const TURN_2_RESPONSE =
  "Magaling! Naiisip mo na ang water vapor at pag-akyat niya sa hangin. Pagkatapos kaya umangat ang vapor, ano sa palagay mo ang nangyayari kapag lumamig siya sa taas ng atmosphere?";

const TURN_3_RESPONSE =
  "Ayos, naiuugnay mo na sa clouds ang idea! ☁️ Bakit kaya nagiging mabigat ang droplets at bumabagsak mula sa ulap? Ano kaya ang tawag doon kapag nagsimulang bumaba ulit ang tubig?";

const TURN_4_RESPONSE =
  "Ang galing mo, ikaw mismo ang nakadiscover nito with a little guidance! 🌧️ Nakuha mo ang water cycle stages: evaporation, condensation, at precipitation. Gusto mo bang subukan ang another topic o mag-scan ulit ng page?";

const FALLBACK_RESPONSE =
  "Subukan nating balikan ang teksto, kaibigan. 😊 May nakikita ka bang salita doon na nagsisimula sa letter E, at ano kaya ang ibig sabihin nun sa sentence?";

const SOCRATIC_REDIRECT_RESPONSE =
  "Alam kong gusto mo nang malaman ang sagot, pero mas matututo ka kapag ikaw mismo ang naka-discover! Subukan nating tingnan ang unang bahagi ng text. Ano kaya ang ibig sabihin ng salitang iyon batay sa pagkakagamit nito sa pangungusap? Kaya mo iyan! 😊";

const CONVERSATION_TURNS: TurnResponse[] = [
  {
    triggers: ["tubig", "water cycle", "watercycle", "water"],
    response: TURN_1_RESPONSE,
  },
  {
    triggers: [
      "pumupunta sa hangin",
      "nagiging vapor",
      "sumisingaw",
      "water vapor",
    ],
    response: TURN_2_RESPONSE,
  },
  {
    triggers: [
      "nagiging ulap",
      "bumabalik sa clouds",
      "clouds",
      "condensation",
    ],
    response: TURN_3_RESPONSE,
  },
  {
    triggers: [
      "umiulan",
      "rain",
      "bumabagsak",
      "cycle repeats",
      "repeats endlessly",
      "precipitation",
    ],
    response: TURN_4_RESPONSE,
  },
];

const DEMANDING_PHRASES = [
  "sagot",
  "answer",
  "sabihin mo na",
  "tell me",
  "ano ba yan",
  "just give it",
  "di ko alam",
  "i don't know",
  "ang hirap",
  "too hard",
];

function createSocraticRedirect(): string {
  return SOCRATIC_REDIRECT_RESPONSE;
}

export function getMockResponse(userMessage: string): string {
  const normalized = userMessage.toLowerCase().trim();

  if (!normalized) {
    return FALLBACK_RESPONSE;
  }

  if (DEMANDING_PHRASES.some((phrase) => normalized.includes(phrase))) {
    return createSocraticRedirect();
  }

  for (const turn of CONVERSATION_TURNS) {
    if (turn.triggers.some((trigger) => normalized.includes(trigger))) {
      return turn.response;
    }
  }

  return FALLBACK_RESPONSE;
}
