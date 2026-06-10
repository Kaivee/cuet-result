import { PDFParse } from "pdf-parse";

export interface ExtractedPdfData {
  text: string;
  questionPages: Record<string, number>;
}

/**
 * Extract plain text and map question IDs to page numbers from a PDF File object
 * on the client side. This ensures layout and page mapping are identical to the
 * backend parser.
 */
export async function extractTextFromPdf(file: File): Promise<ExtractedPdfData> {
  const arrayBuffer = await file.arrayBuffer();
  const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });

  // Set the worker URL to a public CDN matching the local pdfjs-dist version
  PDFParse.setWorker("https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs");

  const result = await parser.getText();
  await parser.destroy();

  const questionPages: Record<string, number> = {};
  for (const page of result.pages) {
    const pageNum = page.num;
    const matches = page.text.matchAll(/Question\s+ID\s*:\s*(\d{9,})/ig);
    for (const match of matches) {
      const qid = match[1];
      questionPages[qid] = pageNum;
    }
  }

  return {
    text: result.text,
    questionPages,
  };
}
