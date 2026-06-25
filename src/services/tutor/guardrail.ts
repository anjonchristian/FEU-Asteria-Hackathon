/**
 * Socratic Guardrail — Post-processing filter that prevents direct answers
 * from reaching the student. This is the safety net when the LLM fails
 * to follow the Socratic prompt instructions.
 */

// Patterns that indicate the AI gave a direct answer
const DIRECT_ANSWER_PATTERNS = [
  // Filipino patterns
  /ang\s+(tamang\s+)?sagot\s+(ay|diyan|dito)\s/i,
  /kaya\s+ang\s+sagot\s+(ay|diyan)\s/i,
  /ang\s+resulta\s+(ay|diyan)\s/i,
  /tamang\s+sagot\s+(ay|diyan)\s/i,
  /dapat\s+ay\s+\d+/i,
  /exactly\s+ang\s+sagot/i,

  // English patterns
  /the\s+(correct\s+)?answer\s+is\s/i,
  /the\s+solution\s+is\s/i,
  /it\s+equals\s+\d+/i,
  /the\s+result\s+is\s+\d+/i,
  /therefore\s+the\s+answer/i,
  /we\s+can\s+conclude\s+that/i,
  /in\s+conclusion/i,

  // Mathematical giveaways
  /=\s*\d+\s*$/m,
  /^\d+\s*$/m,

  // Declarative finality
  /^(oo|yes|tama|correct)[,.\s]*$/i,
  /^(iyan|yun|yon)\s+(ang|na)\s+(sagot|tama)/i,
];

// Patterns indicating the student is demanding an answer
const STUDENT_DEMAND_PATTERNS = [
  /(sagot|answer).*(ngayon|now|please|pls)/i,
  /(bigay|give).*(sagot|answer)/i,
  /(just|lamang).*(sagot|answer|tell)/i,
  /huwag\s+(mo|kang)\s+(mag|maging)/i, // "Don't be..."
  /(sabihin|tell)\s+(mo|me)\s+(na|lang|kasi)/i,
];

export interface GuardrailResult {
  passed: boolean;
  originalText: string;
  filteredText: string;
  triggeredPattern?: string;
}

/**
 * Check if the AI response contains a direct answer.
 * If so, rewrite it as a Socratic redirect.
 */
export function applySocraticGuardrail(
  aiResponse: string,
  studentMessage: string,
  textbookContext: string,
): GuardrailResult {
  // Check for direct answer patterns
  for (const pattern of DIRECT_ANSWER_PATTERNS) {
    if (pattern.test(aiResponse)) {
      console.warn(`[Guardrail] Direct answer detected! Pattern: ${pattern}`);
      return {
        passed: false,
        originalText: aiResponse,
        filteredText: generateSocraticRedirect(studentMessage, textbookContext),
        triggeredPattern: pattern.toString(),
      };
    }
  }

  // Check if response is suspiciously short and contains a number
  // (often means the AI just output the answer)
  const trimmed = aiResponse.trim();
  if (trimmed.length < 10 && /\d+/.test(trimmed)) {
    console.warn("[Guardrail] Suspicious short numeric response detected");
    return {
      passed: false,
      originalText: aiResponse,
      filteredText: generateSocraticRedirect(studentMessage, textbookContext),
      triggeredPattern: "short_numeric_response",
    };
  }

  // Response passed all checks
  return {
    passed: true,
    originalText: aiResponse,
    filteredText: aiResponse,
  };
}

/**
 * Generate a Socratic redirect when the AI slips up.
 * This should feel natural and encouraging, not robotic.
 */
function generateSocraticRedirect(
  studentMessage: string,
  textbookContext: string,
): string {
  // Check if student was demanding an answer
  const wasDemanding = STUDENT_DEMAND_PATTERNS.some((p) =>
    p.test(studentMessage),
  );

  if (wasDemanding) {
    return "Alam kong gusto mo nang malaman ang sagot, pero mas matututo ka kapag ikaw mismo ang naka-discover nito! Subukan natin: ano sa palagay mo ang unang hakbang na dapat gawin? Kaya mo iyan, kaibigan! 😊";
  }

  // Default Socratic redirects (rotate for variety)
  const redirects = [
    "Hindi ko puwedeng ibigay ang direktang sagot, pero tutulungan kitang mahanap ito! Tingnan nating mabuti ang problema. Ano sa palagay mo ang ibig sabihin ng unang bahagi?",
    "Subukan nating pag-isipan ito nang magkasama. Ano ang mga importanteng detalye na nakikita mo sa tanong? Doon tayo magsimula!",
    "Alam mo, ang pinakamagandang paraan para matuto ay ang ikaw mismo ang tumuklas ng sagot. Handa ka na bang subukan? Ano ang una mong naiisip kapag binasa mo ang tanong?",
    "Bago natin makuha ang sagot, balikan muna natin ang basics. May nakikita ka bang clue sa tanong kung anong operation ang dapat gamitin?",
  ];

  const randomIndex = Math.floor(Math.random() * redirects.length);
  return redirects[randomIndex];
}

/**
 * Quick pre-check: should we even try to respond, or is this off-topic?
 */
export function isOffTopic(message: string): boolean {
  const lower = message.toLowerCase().trim();

  const offTopicPatterns = [
    /^(ignore|bypass|hack|override|reset)\s/i,
    /system\s*prompt/i,
    /pretend\s*(you|to\s*be)/i,
    /you\s*are\s*now/i,
    /new\s*instructions/i,
    /forget\s*(everything|all|previous)/i,
    /(kill|destroy|murder|hurt|harm)\s*(yourself|me|people)/i,
    /(sex|porn|nude|naked)/i,
    /\b(bobo|tanga|gago|putang|tangina|fuck|shit)\b/i,
    /(roblox|minecraft|fortnite|mobile\s*legends|call\s*of\s*duty)/i,
  ];

  return offTopicPatterns.some((p) => p.test(lower));
}

/**
 * Get a gentle redirect for off-topic messages
 */
export function getOffTopicResponse(): string {
  return "Tumutok muna tayo sa ating leksyon ngayon, kaibigan! 😊 Mayroon akong inihandang tanong mula sa iyong na-scan na babasahin. Handa ka na bang sagutin ito?";
}
