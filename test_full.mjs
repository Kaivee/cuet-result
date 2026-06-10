import { readFileSync } from 'fs';

// ─── extractText ─────────────────────────────────────────────────────────
async function extractText(buffer) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

// ─── Response Sheet Parser (unchanged) ────────────────────────────────────
const Q_ID_RE = /^Question\s+ID\s*:\s*(\d{9,})/i;
const OPT_ID_RE = /^Option\s+([1-4])\s+ID\s*:\s*(\d{9,})/i;
const CHOSEN_RE = /^Chosen\s+Option\s*:\s*(-{1,2}|[1-4])/i;

function parseResponseSheet(text) {
  const map = new Map();
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);
  let currentId = null;
  let chosen = 0;
  const opts = new Array(4).fill('');
  const flush = () => {
    if (currentId && opts.some(Boolean)) {
      map.set(currentId, { questionId: currentId, chosenOptionIndex: chosen, optionIds: [...opts] });
    }
  };
  for (const line of lines) {
    const qm = line.match(Q_ID_RE);
    if (qm) { flush(); currentId = qm[1]; chosen = 0; opts.fill(''); continue; }
    const om = line.match(OPT_ID_RE);
    if (om) { opts[parseInt(om[1], 10) - 1] = om[2]; continue; }
    const cm = line.match(CHOSEN_RE);
    if (cm) { chosen = cm[1].startsWith('-') ? 0 : parseInt(cm[1], 10); continue; }
  }
  flush();
  return map;
}

// ─── NEW Answer Key Parser (fixed) ────────────────────────────────────────
const LONG_ID = /\d{10,}/g;
const SKIP_RE = /question\s|option|answer\s*key|^sno\b|paper|section|http|examinationservices|digialm|common university|cuet|select subject|disclaimer|nic\.in|^name:|application\s*(no|number)|roll\s*(no|number)|father|mother|candidate|date of birth|challeng|-- \d+ of \d+ --|save your claims/i;

function parseAnswerKey(text) {
  const map = new Map();
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (SKIP_RE.test(line)) continue;
    const ids = extractIds(line);
    if (ids.length === 2) {
      const [questionId, correctOptionId] = ids;
      if (!map.has(questionId)) {
        map.set(questionId, { questionId, correctOptionId });
      }
    }
  }
  return map;
}

function extractIds(line) {
  const re = new RegExp(LONG_ID.source, "g");
  const results = [];
  let m;
  while ((m = re.exec(line)) !== null) {
    results.push(m[0]);
  }
  return results;
}

// ─── Compare Engine ──────────────────────────────────────────────────────
function compareAnswers(responseSheet, answerKey) {
  const results = [];
  for (const [questionId, entry] of responseSheet) {
    const { chosenOptionIndex, optionIds } = entry;
    const chosenOptionId = (chosenOptionIndex > 0 && chosenOptionIndex <= optionIds.length)
      ? optionIds[chosenOptionIndex - 1] : null;
    const keyEntry = answerKey.get(questionId);
    let status, correctOptionId;
    if (!keyEntry) {
      status = 'missing_in_key';
      correctOptionId = 'N/A';
    } else {
      correctOptionId = keyEntry.correctOptionId;
      if (!chosenOptionId) status = 'not_attempted';
      else if (chosenOptionId === correctOptionId) status = 'correct';
      else status = 'incorrect';
    }
    results.push({ questionId, chosenOptionId, correctOptionId, status });
  }
  return results;
}

// ─── Run tests ───────────────────────────────────────────────────────────
const pairs = [
  { response: '1 response.pdf', answerKey: '1 ans key.pdf', label: 'Pair 1 (History + Fine Arts)' },
  { response: '2 response.pdf', answerKey: '2 ans key.pdf', label: 'Pair 2 (Fine Arts + Economics)' },
  // Cross-pair to test mismatch
  { response: '1 response.pdf', answerKey: '2 ans key.pdf', label: 'Cross: 1-response vs 2-key' },
  { response: '2 response.pdf', answerKey: '1 ans key.pdf', label: 'Cross: 2-response vs 1-key' },
];

for (const { response, answerKey: akFile, label } of pairs) {
  console.log(`\n=== ${label} ===`);
  
  const rsBuf = readFileSync(response);
  const akBuf = readFileSync(akFile);
  const rsText = await extractText(rsBuf);
  const akText = await extractText(akBuf);
  
  const rs = parseResponseSheet(rsText);
  const ak = parseAnswerKey(akText);
  console.log(`Response sheet: ${rs.size} questions`);
  console.log(`Answer key: ${ak.size} questions`);
  
  const results = compareAnswers(rs, ak);
  const correct = results.filter(r => r.status === 'correct').length;
  const incorrect = results.filter(r => r.status === 'incorrect').length;
  const notAttempted = results.filter(r => r.status === 'not_attempted').length;
  const missing = results.filter(r => r.status === 'missing_in_key').length;
  
  console.log(`Results: ${correct} correct, ${incorrect} incorrect, ${notAttempted} not attempted, ${missing} missing in key`);
  console.log(`CUET score: ${correct * 5 + incorrect * (-1)}`);
}
