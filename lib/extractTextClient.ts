import { PDFParse } from "pdf-parse";

/**
 * Extract plain text from a PDF File object on the client side using the
 * browser-compatible build of pdf-parse. This ensures layout and newline
 * preservation are identical to the backend parser.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) });

  // Set the worker URL to a public CDN matching the local pdfjs-dist version
  PDFParse.setWorker("https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs");

  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}
