import { readFileSync } from 'fs';

async function extractText(buffer) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

const Q_ID_RE = /^Question\s+ID\s*:\s*(\d{9,})/i;

// Extract question IDs from response sheets
function getResponseIds(text) {
  const ids = new Set();
  for (const line of text.split('\n')) {
    const m = line.trim().match(Q_ID_RE);
    if (m) ids.add(m[1]);
  }
  return ids;
}

const LONG_ID = /\d{10,}/g;
const SKIP_RE = /question\s|option|answer\s*key|^sno\b|paper|section|http|examinationservices|digialm|common university|cuet|select subject|disclaimer|nic\.in|^name:|application\s*(no|number)|roll\s*(no|number)|father|mother|candidate|date of birth|challeng|-- \d+ of \d+ --|save your claims/i;

function getAKIds(text) {
  const ids = new Set();
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || SKIP_RE.test(trimmed)) continue;
    const re = new RegExp(LONG_ID.source, "g");
    const matches = [];
    let m;
    while ((m = re.exec(trimmed)) !== null) matches.push(m[0]);
    if (matches.length === 2) ids.add(matches[0]);
  }
  return ids;
}

// Load all 4 files
const r1 = await extractText(readFileSync('1 response.pdf'));
const r2 = await extractText(readFileSync('2 response.pdf'));
const a1 = await extractText(readFileSync('1 ans key.pdf'));
const a2 = await extractText(readFileSync('2 ans key.pdf'));

const rs1 = getResponseIds(r1);
const rs2 = getResponseIds(r2);
const ak1 = getAKIds(a1);
const ak2 = getAKIds(a2);

console.log(`Response 1: ${rs1.size} IDs`);
console.log(`Response 2: ${rs2.size} IDs`);
console.log(`Answer Key 1: ${ak1.size} IDs`);
console.log(`Answer Key 2: ${ak2.size} IDs`);

// Check overlaps
function overlap(a, b) {
  let count = 0;
  for (const id of a) if (b.has(id)) count++;
  return count;
}

console.log(`\nOverlaps:`);
console.log(`  R1 ∩ AK1: ${overlap(rs1, ak1)} / ${rs1.size}`);
console.log(`  R1 ∩ AK2: ${overlap(rs1, ak2)} / ${rs1.size}`);
console.log(`  R2 ∩ AK1: ${overlap(rs2, ak1)} / ${rs2.size}`);
console.log(`  R2 ∩ AK2: ${overlap(rs2, ak2)} / ${rs2.size}`);

// Union of both AKs
const akAll = new Set([...ak1, ...ak2]);
console.log(`\n  R1 ∩ (AK1+AK2): ${overlap(rs1, akAll)} / ${rs1.size}`);
console.log(`  R2 ∩ (AK1+AK2): ${overlap(rs2, akAll)} / ${rs2.size}`);
