const TRAILING_NOISE = /[\|\\/_^~`•·]+$/g;
const REPEATED_PUNCT = /([.,!?;:])\1{2,}/g;

function cleanLine(line: string): string {
  return line
    .trim()
    .replace(TRAILING_NOISE, "")
    .replace(REPEATED_PUNCT, "$1")
    .replace(/\s{2,}/g, " ");
}

function isMeaningfulLine(line: string): boolean {
  if (line.length < 2) return false;

  const alnumMatches = line.match(/[\p{L}\p{N}]/gu);
  const alnumCount = alnumMatches?.length ?? 0;
  return alnumCount / line.length >= 0.3;
}

/** Removes OCR noise and formats text for LLM consumption. */
export function cleanOcrText(raw: string): string {
  const normalized = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  const lines = normalized
    .split("\n")
    .map(cleanLine)
    .filter(isMeaningfulLine);

  return lines.join("\n").trim();
}

export function countLines(text: string): number {
  if (!text.trim()) return 0;
  return text.split("\n").length;
}
