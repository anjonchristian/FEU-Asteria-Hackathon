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
  /ang\s+final\s+answer\s+(ay|is)\s/i,
  /so\s+ang\s+sagot\s+(ay|is)\s/i,
  /yun\s+ang\s+tama/i,
  /ito\s+ang\s+sagot/i,
  /dapat\s+ay\s+\d+/i,
  /exactly\s+ang\s+sagot/i,

  // English patterns
  /the\s+(correct\s+)?answer\s+is\s/i,
  /the\s+solution\s+is\s/i,
  /the\s+final\s+answer\s+is\s/i,
  /it\s+equals\s+\d+/i,
  /the\s+result\s+is\s+\d+/i,
  /therefore\s+the\s+answer/i,
  /we\s+can\s+conclude\s+that/i,
  /in\s+conclusion/i,
  /so\s+the\s+answer\s+is\s/i,
  /this\s+means\s+that\s+the\s+answer\s+is\s/i,

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

export function isStudentDemandingAnswer(message: string): boolean {
  return STUDENT_DEMAND_PATTERNS.some((pattern) => pattern.test(message));
}

function extractLessonKeywords(textbookContext: string): string[] {
  const stopwords = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "your",
    "you",
    "are",
    "was",
    "were",
    "will",
    "have",
    "has",
    "had",
    "through",
    "into",
    "their",
    "there",
    "text",
    "textbook",
    "page",
    "study",
    "lesson",
    "cycle",
  ]);

  const tokens =
    textbookContext
      .toLowerCase()
      .match(/[a-z]+/g)
      ?.filter((token) => token.length >= 4 && !stopwords.has(token)) ?? [];

  return [...new Set(tokens)].slice(0, 12);
}

export function shouldUseOffTopicResponse(
  studentMessage: string,
  recentMessages: string[],
  textbookContext: string,
): boolean {
  if (!isOffTopic(studentMessage)) {
    return false;
  }

  const windowText = [studentMessage, ...recentMessages]
    .join(" ")
    .toLowerCase();
  const lessonKeywords = extractLessonKeywords(textbookContext);

  if (lessonKeywords.length === 0) {
    return true;
  }

  const hasLessonContinuity = lessonKeywords.some((keyword) =>
    windowText.includes(keyword),
  );

  return !hasLessonContinuity;
}

function isStudentShowingUnderstanding(studentMessage: string): boolean {
  const lower = studentMessage.toLowerCase();

  const confidenceSignals = [
    /\btama\b/i,
    /\bcorrect\b/i,
    /\byes\b/i,
    /\boo\b/i,
    /\bokay\b/i,
    /\bgets\s*ko\b/i,
    /\bi\s+get\s+it\b/i,
    /\bgot\s+it\b/i,
    /\bnaintindihan\s*ko\b/i,
    /\bnaiintindihan\s*ko\b/i,
    /\bayun\b/i,
  ];

  const answerSignals = [
    /evapor/i,
    /condens/i,
    /precipitat/i,
    /water\s+vapor/i,
    /sumisingaw/i,
    /nagiging\s+vapor/i,
    /nagiging\s+ulap/i,
    /bumabalik\s+sa\s+clouds?/i,
    /bumabagsak/i,
    /umuulan/i,
    /rain/i,
    /snow/i,
    /hail/i,
  ];

  return (
    confidenceSignals.some((pattern) => pattern.test(lower)) ||
    answerSignals.some((pattern) => pattern.test(lower))
  );
}

export function shouldUseMasteryResponse(
  studentMessage: string,
  recentMessages: string[],
  textbookContext: string,
): boolean {
  const windowText = [studentMessage, ...recentMessages]
    .join(" ")
    .toLowerCase();
  const lessonKeywords = extractLessonKeywords(textbookContext);

  if (lessonKeywords.length === 0) {
    return false;
  }

  const isAboutLesson = lessonKeywords.some((keyword) =>
    windowText.includes(keyword),
  );

  return isAboutLesson && isStudentShowingUnderstanding(studentMessage);
}

function getTextbookCue(textbookContext: string): string {
  const lower = textbookContext.toLowerCase();

  if (lower.includes("evaporation")) {
    return "Balikan natin ang bahagi tungkol sa evaporation";
  }
  if (lower.includes("condensation")) {
    return "Balikan natin ang bahagi tungkol sa condensation";
  }
  if (lower.includes("precipitation")) {
    return "Balikan natin ang bahagi tungkol sa precipitation";
  }
  if (lower.includes("water cycle")) {
    return "Balikan natin ang bahagi tungkol sa water cycle";
  }

  return textbookContext
    ? "Balikan natin ang text at hanapin ang clue sa unang pangungusap"
    : "Balikan natin ang text at hanapin ang clue sa tanong";
}

export function getMasteryTransitionResponse(textbookContext: string): string {
  const lower = textbookContext.toLowerCase();

  if (
    lower.includes("evaporation") &&
    lower.includes("condensation") &&
    lower.includes("precipitation")
  ) {
    return "Magaling, tama ka — mukhang nakuha mo na ang buong water cycle! 😊 Ano pa ang hindi mo pa gaanong sure: evaporation, condensation, o precipitation?";
  }

  if (lower.includes("evaporation")) {
    return "Magaling, tama ka — nakuha mo na ang idea tungkol sa evaporation! 😊 Ano pa ang gusto mong linawin mula sa text?";
  }

  if (lower.includes("condensation")) {
    return "Magaling, tama ka — nakuha mo na ang idea tungkol sa condensation! ☁️ Ano pa ang hindi mo pa ganap na sure?";
  }

  if (lower.includes("precipitation")) {
    return "Magaling, tama ka — nakuha mo na ang idea tungkol sa precipitation! 🌧️ May iba ka pa bang bahaging gusto mong balikan?";
  }

  return "Magaling, tama ka — mukhang nakuha mo na ang lesson! 😊 Ano pa ang hindi mo pa ganap na sure?";
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
  const trimmed = aiResponse.trim();

  // Check for direct answer patterns
  for (const pattern of DIRECT_ANSWER_PATTERNS) {
    if (pattern.test(trimmed)) {
      console.warn(`[Guardrail] Direct answer detected! Pattern: ${pattern}`);
      return {
        passed: false,
        originalText: trimmed,
        filteredText: generateSocraticRedirect(studentMessage, textbookContext),
        triggeredPattern: pattern.toString(),
      };
    }
  }

  // Check if response is suspiciously short and contains a number
  // (often means the AI just output the answer)
  if (trimmed.length < 10 && /\d+/.test(trimmed)) {
    console.warn("[Guardrail] Suspicious short numeric response detected");
    return {
      passed: false,
      originalText: trimmed,
      filteredText: generateSocraticRedirect(studentMessage, textbookContext),
      triggeredPattern: "short_numeric_response",
    };
  }

  // Response passed all checks
  return {
    passed: true,
    originalText: trimmed,
    filteredText: trimmed,
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
  const wasDemanding = isStudentDemandingAnswer(studentMessage);

  if (wasDemanding) {
    return `Alam kong gusto mo nang malaman ang sagot, pero mas matututo ka kapag ikaw mismo ang naka-discover nito! ${getTextbookCue(textbookContext)}. Ano sa palagay mo ang unang clue na makikita mo? Kaya mo iyan, kaibigan! 😊`;
  }

  const topicHint = getTextbookCue(textbookContext);

  // Default Socratic redirects (rotate for variety)
  const redirects = [
    `Hindi ko puwedeng ibigay ang direktang sagot, pero tutulungan kitang mahanap ito! ${topicHint} Ano sa palagay mo ang ibig sabihin ng unang bahagi?`,
    `Subukan nating pag-isipan ito nang magkasama. ${topicHint} Ano ang importanteng detail na napansin mo?`,
    `Ang pinakamagandang paraan para matuto ay ikaw mismo ang tumuklas ng sagot. ${topicHint} Ano ang una mong naiisip kapag binasa mo ulit?`,
    `Bago natin makuha ang sagot, balikan muna natin ang basics. ${topicHint} May clue ka bang nakita na puwedeng gabayan tayo?`,
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

export function getSocraticRedirectResponse(
  studentMessage: string,
  textbookContext: string,
): string {
  return generateSocraticRedirect(studentMessage, textbookContext);
}
