import type { LlmOcrContext } from "./types";

export interface LlmContextProfile {
  language: string;
  name: string;
  grade: string;
  subjects: string[];
}

export function buildLlmOcrContext(
  cleanedText: string,
  profile: LlmContextProfile,
): LlmOcrContext {
  const scannedAt = new Date().toISOString();
  const studentName = profile.name.trim() || "Learner";
  const gradeLabel = profile.grade.trim() || "primary";
  const subjectList =
    profile.subjects.length > 0
      ? profile.subjects.join(", ")
      : "general studies";

  if (profile.language === "fil") {
    return {
      scannedAt,
      referenceText: cleanedText,
      systemContext:
        "Ikaw ang Kuya Bots — isang mabait na offline na tutor para sa mga batang Pilipino. " +
        "Gamitin ang na-scan na teksto bilang sanggunian, kahit anong paksa pa ito. Magtanong, huwag ibigay agad ang buong sagot, at manatili lang sa laman ng OCR.",
      userPrompt:
        `Ang estudyanteng si ${studentName} (Grade ${gradeLabel}, subjects: ${subjectList}) ` +
        `ay nag-scan ng teksto mula sa textbook o worksheet. Basahin at tulungan siyang maintindihan:\n\n` +
        `--- NA-SCAN NA TEKSTO ---\n${cleanedText}\n--- WAKAS ---\n\n` +
        "Magtanong ng isang simpleng tanong para suriin kung naintindihan niya.",
    };
  }

  return {
    scannedAt,
    referenceText: cleanedText,
    systemContext:
      "You are Kuya Bots — a friendly offline tutor for Filipino primary students. " +
      "Use the scanned text as reference for any subject. Guide with questions, do not give full answers immediately, and stay within the OCR content.",
    userPrompt:
      `Student ${studentName} (Grade ${gradeLabel}, subjects: ${subjectList}) ` +
      `scanned text from a textbook or worksheet. Help them understand:\n\n` +
      `--- SCANNED TEXT ---\n${cleanedText}\n--- END ---\n\n` +
      "Ask one simple question to check their understanding.",
  };
}
