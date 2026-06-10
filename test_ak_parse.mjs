import { readFileSync } from 'fs';

// Simulate the answer key parser logic
const LONG_ID = /\d{9,}/g;
const SKIP_RE = /question|option|answer|sno|paper|section|http|examinationservices|digialm|common university|cuet|select subject|disclaimer|nic\.in|name:|application|roll|father|mother|candidate|date of birth|challenge|-- \d+ of \d+ --|\d+$/i;

function extractIds(line) {
  const re = new RegExp(LONG_ID.source, "g");
  const results = [];
  let m;
  while ((m = re.exec(line)) !== null) {
    results.push(m[0]);
  }
  return results;
}

// Read ans key text
const text = readFileSync('1 ans key_debug.txt', 'utf-8');
const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);

let twoIdLines = 0;
let threeIdLines = 0;
let skippedLines = 0;
let otherLines = 0;

for (const line of lines) {
  if (SKIP_RE.test(line)) { skippedLines++; continue; }
  const ids = extractIds(line);
  if (ids.length === 2) {
    twoIdLines++;
    if (twoIdLines <= 5) console.log(`2-ID line: "${line}" → IDs: ${ids.join(', ')}`);
  } else if (ids.length === 3) {
    threeIdLines++;
    if (threeIdLines <= 3) console.log(`3-ID line: "${line}" → IDs: ${ids.join(', ')}`);
  } else if (ids.length >= 1) {
    otherLines++;
    if (otherLines <= 5) console.log(`${ids.length}-ID line: "${line}" → IDs: ${ids.join(', ')}`);
  }
}

console.log(`\nSummary: ${twoIdLines} two-ID lines (parsed as questions), ${threeIdLines} three-ID lines (skipped), ${skippedLines} skipped by regex, ${otherLines} other`);

// Now check: the SKIP_RE has a |\d+$ pattern which matches lines ENDING with digits
// Let's check how many lines are falsely skipped
let falseSkips = 0;
for (const line of lines) {
  if (SKIP_RE.test(line)) {
    const ids = extractIds(line);
    if (ids.length === 2) {
      falseSkips++;
      if (falseSkips <= 5) console.log(`FALSE SKIP (2-ID): "${line}"`);
    }
  }
}
console.log(`\nFalse skips (lines with 2 IDs that got skipped): ${falseSkips}`);
