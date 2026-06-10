import type { ResponseSheetEntry, ResponseSheetMap } from "@/types";

// ─── Regex Patterns (tuned to the actual NTA CUET response sheet PDF) ─────────

// "Question ID : 226895795715"
const Q_ID_RE = /^Question\s+ID\s*:\s*(\d{9,})/i;

// "Option 1 ID : 2268953085921"
const OPT_ID_RE = /^Option\s+([1-4])\s+ID\s*:\s*(\d{9,})/i;

// "Chosen Option : 4"  OR  "Chosen Option : --"
const CHOSEN_RE = /^Chosen\s+Option\s*:\s*(-{1,2}|[1-4])/i;

// "Section : History"
const SECTION_RE = /^Section\s*:\s*(.+)/i;

// ─── Parser ───────────────────────────────────────────────────────────────────

/**
 * Parse the raw text from the NTA CUET Response Sheet PDF.
 *
 * The PDF text has blocks like:
 *   Question ID : 226895795715
 *   Option 1 ID : 2268953085921
 *   Option 2 ID : 2268953085922
 *   Option 3 ID : 2268953085923
 *   Option 4 ID : 2268953085924
 *   Status : Answered
 *   Chosen Option : 4
 */
export function parseResponseSheet(text: string): ResponseSheetMap {
  const map: ResponseSheetMap = new Map();

  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let currentId: string | null = null;
  let chosen = 0;
  const opts: string[] = new Array(4).fill("");
  let currentSubject = "Unknown Subject";

  const flush = () => {
    if (currentId && opts.some(Boolean)) {
      map.set(currentId, {
        questionId: currentId,
        chosenOptionIndex: chosen,
        optionIds: [...opts],
        subject: currentSubject,
      });
    }
  };

  for (const line of lines) {
    // ── Section Name ─────────────────────────────────────────────────────────
    const sm = line.match(SECTION_RE);
    if (sm) {
      currentSubject = sm[1].trim();
      continue;
    }

    // ── Question ID ──────────────────────────────────────────────────────────
    const qm = line.match(Q_ID_RE);
    if (qm) {
      flush();
      currentId = qm[1];
      chosen = 0;
      opts.fill("");
      continue;
    }

    // ── Option N ID ──────────────────────────────────────────────────────────
    const om = line.match(OPT_ID_RE);
    if (om) {
      const idx = parseInt(om[1], 10) - 1; // 0-based
      opts[idx] = om[2];
      continue;
    }

    // ── Chosen Option ────────────────────────────────────────────────────────
    const cm = line.match(CHOSEN_RE);
    if (cm) {
      const raw = cm[1].trim();
      chosen = raw.startsWith("-") ? 0 : parseInt(raw, 10);
      continue;
    }
  }

  flush(); // last question

  return map;
}
