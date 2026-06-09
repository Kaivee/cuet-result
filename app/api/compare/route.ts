import { NextRequest, NextResponse } from "next/server";
import { parseResponseSheet } from "@/lib/parseResponseSheet";
import { parseAnswerKey } from "@/lib/parseAnswerKey";
import { compareAnswers, calculateStats } from "@/lib/compareAnswers";
import type { CompareApiResponse, CompareApiError } from "@/types";

// ─── pdf-parse helper (new v3 API) ───────────────────────────────────────────

/**
 * Extract plain text from a PDF buffer using pdf-parse v3.
 * The new API uses a PDFParse class where { data } is passed to the constructor.
 */
async function extractText(buffer: Buffer): Promise<string> {
  // pdf-parse v3 exports named class PDFParse, no default function
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest
): Promise<NextResponse<CompareApiResponse | CompareApiError>> {
  try {
    // ── Parse multipart form data ────────────────────────────────────────────
    const formData = await request.formData();

    const responseSheetFile = formData.get("responseSheet");
    const answerKeyFile = formData.get("answerKey");

    if (!responseSheetFile || !(responseSheetFile instanceof File)) {
      return NextResponse.json(
        { error: "Missing file: responseSheet" },
        { status: 400 }
      );
    }
    if (!answerKeyFile || !(answerKeyFile instanceof File)) {
      return NextResponse.json(
        { error: "Missing file: answerKey" },
        { status: 400 }
      );
    }

    if (!responseSheetFile.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Response Sheet must be a PDF file." },
        { status: 400 }
      );
    }
    if (!answerKeyFile.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Answer Key must be a PDF file." },
        { status: 400 }
      );
    }

    // ── Extract text from both PDFs ──────────────────────────────────────────
    let responseText: string;
    let answerKeyText: string;

    try {
      const [rsBuffer, akBuffer] = await Promise.all([
        responseSheetFile.arrayBuffer().then((ab) => Buffer.from(ab)),
        answerKeyFile.arrayBuffer().then((ab) => Buffer.from(ab)),
      ]);
      [responseText, answerKeyText] = await Promise.all([
        extractText(rsBuffer),
        extractText(akBuffer),
      ]);
    } catch (err) {
      return NextResponse.json(
        {
          error: "Failed to read PDF files. Ensure files are valid PDFs.",
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 422 }
      );
    }

    // ── Parse Response Sheet ─────────────────────────────────────────────────
    const responseSheet = parseResponseSheet(responseText);
    if (responseSheet.size === 0) {
      return NextResponse.json(
        {
          error:
            "Could not parse the Response Sheet PDF. " +
            "Please upload the NTA CUET Response Sheet (not the Question Paper).",
        },
        { status: 422 }
      );
    }

    // ── Parse Answer Key ─────────────────────────────────────────────────────
    const answerKey = parseAnswerKey(answerKeyText);
    if (answerKey.size === 0) {
      return NextResponse.json(
        {
          error:
            "Could not parse the Answer Key PDF. " +
            "Please upload the official NTA CUET Answer Key PDF.",
        },
        { status: 422 }
      );
    }

    // ── Compare & return ─────────────────────────────────────────────────────
    const results = compareAnswers(responseSheet, answerKey);
    const stats = calculateStats(results);

    return NextResponse.json({ results, stats });
  } catch (err) {
    console.error("[/api/compare] Unexpected error:", err);
    return NextResponse.json(
      {
        error: "An unexpected server error occurred.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
