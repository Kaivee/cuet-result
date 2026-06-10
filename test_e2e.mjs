import { readFileSync } from 'fs';

// Test the exact same extractText function the API uses
async function extractText(buffer) {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

// Simulate the response sheet parser
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

// Test all 4 files
const files = ['1 response.pdf', '1 ans key.pdf', '2 response.pdf', '2 ans key.pdf'];

for (const f of files) {
  try {
    const buf = readFileSync(f);
    const text = await extractText(buf);
    console.log(`✓ extractText("${f}") OK — ${text.length} chars`);
    
    if (f.includes('response')) {
      const rs = parseResponseSheet(text);
      console.log(`  parseResponseSheet: ${rs.size} questions found`);
      if (rs.size > 0) {
        const first = rs.values().next().value;
        console.log(`  First question: ${first.questionId}, chosen=${first.chosenOptionIndex}, opts=${first.optionIds.join(',')}`);
      }
    }
  } catch (err) {
    console.error(`✗ ${f}: ${err.message}`);
    console.error(err.stack);
  }
}
