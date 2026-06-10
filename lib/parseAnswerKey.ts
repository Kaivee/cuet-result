import type { AnswerKeyMap } from "@/types";

// ─── Regex ─────────────────────────────────────────────────────────────────────

/**
 * Each question in the Answer Key PDF appears as a line like:
 *   "226895795966 2268953086910"
 * i.e. two long numeric IDs separated by whitespace on the same line.
 * The first ID is the Question ID, the second is the Correct Option ID.
 *
 * The following line then lists the remaining option IDs, but the PDF text
 * frequently truncates the last ID (e.g. "2268953086909 2268953086910 22689530").
 * We distinguish "question" lines (exactly 2 long IDs) from "option" lines
 * (which we skip).
 */
const LONG_ID = /\d{10,}/g;

// Lines to skip (headers, labels, URLs, page markers, candidate info)
// NOTE: We do NOT use |\d+$ here because that falsely skips all data lines
const SKIP_RE =
  /question\s|option|answer\s*key|^sno\b|paper|section|http|examinationservices|digialm|common university|cuet|select subject|disclaimer|nic\.in|^name:|application\s*(no|number)|roll\s*(no|number)|father|mother|candidate|date of birth|challeng|-- \d+ of \d+ --|save your claims/i;

// ─── Parser ────────────────────────────────────────────────────────────────────

/**
 * Parse the Answer Key PDF text.
 *
 * Actual format per question (multi-line):
 *   "1  101 - English\n(Language)\n226895795966 2268953086910\n2268953086909 2268953086910 22689530"
 *
 * Strategy: find every line that contains EXACTLY two long IDs (10+ digits).
 * These are the question→correctOption pairs.
 * Lines with 1 or 3+ long IDs are serial numbers, option-only rows, or headers.
 * Lines where the last ID is truncated (< 10 digits) won't match our regex, so
 * they effectively have fewer long IDs and are naturally skipped.
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
      // Sanity check: question IDs are typically 12 digits, option IDs 13 digits
      // Both must be at least 10 digits long (already enforced by regex)
      if (!map.has(questionId)) {
        map.set(questionId, { questionId, correctOptionId });
      }
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
