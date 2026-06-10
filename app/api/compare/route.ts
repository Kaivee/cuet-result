import { NextRequest, NextResponse } from "next/server";
import { parseResponseSheet } from "@/lib/parseResponseSheet";
import { parseAnswerKey } from "@/lib/parseAnswerKey";
import { compareAnswers, calculateStats } from "@/lib/compareAnswers";
import type {
  CompareApiResponse,
  CompareApiError,
  ResponseSheetMap,
  AnswerKeyMap,
} from "@/types";

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

    // Support multiple files: "responseSheets" and "answerKeys" (arrays)
    // Also keep backwards compatibility with single "responseSheet" / "answerKey"
    const rsFiles: File[] = [];
    const akFiles: File[] = [];

    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.name.toLowerCase().endsWith(".pdf")) {
        if (key === "responseSheet" || key === "responseSheets") {
          rsFiles.push(value);
        } else if (key === "answerKey" || key === "answerKeys") {
          akFiles.push(value);
        }
      }
    }

    if (rsFiles.length === 0) {
      return NextResponse.json(
        { error: "Missing file: at least one Response Sheet PDF is required." },
        { status: 400 }
      );
    }
    if (akFiles.length === 0) {
      return NextResponse.json(
        { error: "Missing file: at least one Answer Key PDF is required." },
        { status: 400 }
      );
    }

    // ── Extract text from all PDFs ───────────────────────────────────────────
    let responseTexts: string[];
    let answerKeyTexts: string[];

    try {
      const rsBuffers = await Promise.all(
        rsFiles.map((f) => f.arrayBuffer().then((ab) => Buffer.from(ab)))
      );
      const akBuffers = await Promise.all(
        akFiles.map((f) => f.arrayBuffer().then((ab) => Buffer.from(ab)))
      );

      responseTexts = await Promise.all(rsBuffers.map(extractText));
      answerKeyTexts = await Promise.all(akBuffers.map(extractText));
    } catch (err) {
      return NextResponse.json(
        {
          error: "Failed to read PDF files. Ensure files are valid PDFs.",
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 422 }
      );
    }

    // ── Parse & merge all Response Sheets ────────────────────────────────────
    const mergedResponseSheet: ResponseSheetMap = new Map();
    for (const text of responseTexts) {
      const parsed = parseResponseSheet(text);
      for (const [qid, entry] of parsed) {
        if (!mergedResponseSheet.has(qid)) {
          mergedResponseSheet.set(qid, entry);
        }
      }
    }

    if (mergedResponseSheet.size === 0) {
      return NextResponse.json(
        {
          error:
            "Could not parse any Response Sheet PDF. " +
            "Please upload the NTA CUET Response Sheet (not the Question Paper).",
        },
        { status: 422 }
      );
    }

    // ── Parse & merge all Answer Keys ────────────────────────────────────────
    const mergedAnswerKey: AnswerKeyMap = new Map();
    for (const text of answerKeyTexts) {
      const parsed = parseAnswerKey(text);
      for (const [qid, entry] of parsed) {
        if (!mergedAnswerKey.has(qid)) {
          mergedAnswerKey.set(qid, entry);
        }
      }
    }

    if (mergedAnswerKey.size === 0) {
      return NextResponse.json(
        {
          error:
            "Could not parse any Answer Key PDF. " +
            "Please upload the official NTA CUET Answer Key PDF.",
        },
        { status: 422 }
      );
    }

    // ── Compare & return ─────────────────────────────────────────────────────
    const results = compareAnswers(mergedResponseSheet, mergedAnswerKey);
    const stats = calculateStats(results);

    return NextResponse.json({
      results,
      stats,
      meta: {
        responseSheetFiles: rsFiles.map((f) => f.name),
        answerKeyFiles: akFiles.map((f) => f.name),
        totalResponseQuestions: mergedResponseSheet.size,
        totalAnswerKeyQuestions: mergedAnswerKey.size,
      },
    });
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
