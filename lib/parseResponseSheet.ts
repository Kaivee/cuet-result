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

const STATUS_RE = /^Status\s*:\s*(.+)/i;

/**
 * Parse the raw text from the NTA CUET Response Sheet PDF.
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
  
  let textBuffer: string[] = [];
  let parsedTextData = { questionText: "", optionsText: ["", "", "", ""] };

  const flush = () => {
    if (currentId && opts.some(Boolean)) {
      map.set(currentId, {
        questionId: currentId,
        chosenOptionIndex: chosen,
        optionIds: [...opts],
        subject: currentSubject,
        questionText: parsedTextData.questionText,
        optionsText: [...parsedTextData.optionsText],
      });
    }
  };

  const parseQuestionTextBlock = (lines: string[]) => {
    let qText: string[] = [];
    let oText = ["", "", "", ""];
    let currentOpt = -1;
    
    for (const line of lines) {
      const optMatch1 = line.match(/^Options?\s*1\.\s*(.*)/i);
      const optMatchN = line.match(/^([1-4])\.\s*(.*)/);
      
      if (optMatch1) {
        currentOpt = 0;
        oText[currentOpt] = optMatch1[1];
      } else if (optMatchN) {
        const idx = parseInt(optMatchN[1], 10) - 1;
        currentOpt = idx;
        oText[currentOpt] = optMatchN[2];
      } else {
        if (currentOpt >= 0) {
          oText[currentOpt] += "\n" + line;
        } else {
          // It's question text. Ignore "Q.1" or "Q. 1"
          if (!line.match(/^Q\.\s*\d+/i) && !line.match(/^Question\s+Description/i)) {
            qText.push(line);
          }
        }
      }
    }
    
    return {
      questionText: qText.join("\n").trim(),
      optionsText: oText.map(o => o.trim())
    };
  };

  for (const line of lines) {
    // ── Section Name ─────────────────────────────────────────────────────────
    const sm = line.match(SECTION_RE);
    if (sm) {
      currentSubject = sm[1].trim();
      textBuffer = []; // reset buffer on new section
      continue;
    }

    // Ignore Status
    if (line.match(STATUS_RE)) {
      continue;
    }

    // Ignore junk header/footer lines from the PDF text layer
    if (
      line.match(/cdn3\.digialm\.com/i) ||
      line.match(/^--\s*\d+\s+of\s+\d+\s*--$/i) ||
      line.match(/^Comprehension:?$/i)
    ) {
      continue;
    }

    // ── Question ID ──────────────────────────────────────────────────────────
    const qm = line.match(Q_ID_RE);
    if (qm) {
      flush();
      currentId = qm[1];
      chosen = 0;
      opts.fill("");
      parsedTextData = parseQuestionTextBlock(textBuffer);
      textBuffer = [];
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
    
    // If not matched by any metadata regex, it belongs to the text block
    textBuffer.push(line);
  }

  flush(); // last question

  return map;
}
