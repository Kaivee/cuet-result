import { readFileSync, writeFileSync } from 'fs';

const files = [
  '1 response.pdf',
  '1 ans key.pdf',
  '2 response.pdf',
  '2 ans key.pdf',
];

for (const f of files) {
  try {
    const buf = readFileSync(f);
    const mod = await import('pdf-parse');
    const PDFParse = mod.PDFParse;
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();
    await parser.destroy();
    const outName = f.replace('.pdf', '_debug.txt');
    writeFileSync(outName, result.text, 'utf-8');
    console.log(`OK ${f} -> ${outName} (${result.text.length} chars)`);
    console.log('--- first 500 chars ---');
    console.log(result.text.substring(0, 500));
    console.log('--- last 300 chars ---');
    console.log(result.text.substring(result.text.length - 300));
    console.log('');
  } catch (err) {
    console.error(`FAIL ${f}: ${err.message}`);
  }
}
