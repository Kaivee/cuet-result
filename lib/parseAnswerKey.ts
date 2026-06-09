import type { AnswerKeyMap } from "@/types";

// ─── Regex ─────────────────────────────────────────────────────────────────────

/**
 * Each question in the Answer Key PDF appears as a line like:
 *   "226895786303 2268953049172"
 * i.e. two long numeric IDs separated by whitespace on the same line.
 * The first ID is the Question ID, the second is the Correct Option ID.
 * The following line then lists the 3 remaining option IDs (which we ignore).
 *
 * Lines with 3+ IDs are the "all options" lines — skip them.
 * Lines that match only one ID followed by non-ID content are also skipped.
 */
const LONG_ID = /\d{9,}/g;

// Lines to skip (headers, labels, URLs, page markers, candidate info)
const SKIP_RE =
  /question|option|answer|sno|paper|section|http|examinationservices|digialm|common university|cuet|select subject|disclaimer|nic\.in|name:|application|roll|father|mother|candidate|date of birth|challenge|-- \d+ of \d+ --|\/\d+$/i;

// ─── Parser ────────────────────────────────────────────────────────────────────

/**
 * Parse the Answer Key PDF text.
 *
 * Actual format per question (multi-line):
 *   "1  309 -\nEconomics\n...\n226895786303 2268953049172\n2268953049169 2268953049170 2268953049171"
 *
 * Strategy: find every line that contains EXACTLY two long IDs
 * (questionId and correctOptionId). Skip lines with 1 or 3+ IDs.
 */
export function parseAnswerKey(text: string): AnswerKeyMap {
  const map: AnswerKeyMap = new Map();

  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (SKIP_RE.test(line)) continue;

    const ids = extractIds(line);

    if (ids.length === 2) {
      const [questionId, correctOptionId] = ids;
      map.set(questionId, { questionId, correctOptionId });
    }
    // Lines with 1 or 3+ IDs are option-only rows or headers — skip
  }

  return map;
}

// ─── Helper ────────────────────────────────────────────────────────────────────

function extractIds(line: string): string[] {
  const re = new RegExp(LONG_ID.source, "g");
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    results.push(m[0]);
  }
  return results;
}
