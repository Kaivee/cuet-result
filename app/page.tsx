"use client";

import React, { useState, useRef } from "react";
import FileUpload from "@/components/FileUpload";
import SummaryCard from "@/components/SummaryCard";
import ResultsTable from "@/components/ResultsTable";
import type { CompareApiResponse } from "@/types";
import { BookOpen, Zap, AlertTriangle, RotateCcw, ChevronDown, Info } from "lucide-react";

type AppState = "idle" | "loading" | "results" | "error";

export default function HomePage() {
  const [responseSheets, setResponseSheets] = useState<File[]>([]);
  const [answerKeys, setAnswerKeys] = useState<File[]>([]);
  const [appState, setAppState] = useState<AppState>("idle");
  const [results, setResults] = useState<CompareApiResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const resultsRef = useRef<HTMLDivElement>(null);

  const canSubmit = responseSheets.length > 0 && answerKeys.length > 0;

  const handleCompare = async () => {
    if (!canSubmit) return;
    setAppState("loading");
    setErrorMsg("");

    const formData = new FormData();
    for (const file of responseSheets) {
      formData.append("responseSheets", file);
    }
    for (const file of answerKeys) {
      formData.append("answerKeys", file);
    }

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Unknown error from server.");
      }

      setResults(data as CompareApiResponse);
      setAppState("results");

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setAppState("error");
    }
  };

  const handleReset = () => {
    setResponseSheets([]);
    setAnswerKeys([]);
    setResults(null);
    setAppState("idle");
    setErrorMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen">
      {/* ── Background decoration ──────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px]" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-600/15 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-60 bg-violet-900/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-6 shadow-lg shadow-violet-500/10">
            <BookOpen className="h-4 w-4" />
            NTA CUET Answer Checker
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
            Check Your{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              CUET Score
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Upload your Response Sheet(s) and Answer Key(s). We&apos;ll
            automatically match subjects across files and show your detailed results.
          </p>
        </div>

        {/* ── Upload Card ──────────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-xl shadow-2xl p-6 sm:p-8 mb-8">
          {/* ── Tip banner ────────────────────────────────────────────── */}
          <div className="flex items-start gap-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 mb-6">
            <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-300/80 leading-relaxed">
              <span className="font-semibold text-indigo-300">Tip:</span> You can upload multiple Response Sheets and Answer Keys at once.
              We&apos;ll merge all subjects and automatically cross-match them — no need to pair files manually.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <FileUpload
              id="response-sheet-upload"
              label="Response Sheets"
              description="Your NTA CUET response sheet PDF(s)"
              files={responseSheets}
              onFilesChange={setResponseSheets}
              accentColor="violet"
            />
            <FileUpload
              id="answer-key-upload"
              label="Answer Keys"
              description="Official NTA CUET answer key PDF(s)"
              files={answerKeys}
              onFilesChange={setAnswerKeys}
              accentColor="indigo"
            />
          </div>

          {/* ── CTA Button ─────────────────────────────────────────────────── */}
          <button
            id="compare-button"
            onClick={handleCompare}
            disabled={!canSubmit || appState === "loading"}
            className={`
              w-full flex items-center justify-center gap-3 py-4 px-8 rounded-2xl text-base font-bold
              transition-all duration-300 shadow-lg
              ${
                canSubmit && appState !== "loading"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.99]"
                  : "bg-slate-700/50 text-slate-500 cursor-not-allowed border border-slate-600/40"
              }
            `}
          >
            {appState === "loading" ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Analysing PDFs…
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Compare Answers
              </>
            )}
          </button>

          {/* ── Helper text ─────────────────────────────────────────────────── */}
          {!canSubmit && appState === "idle" && (
            <p className="text-center text-xs text-slate-500 mt-3">
              Upload at least one Response Sheet and one Answer Key to compare
            </p>
          )}
        </div>

        {/* ── Error Banner ─────────────────────────────────────────────────── */}
        {appState === "error" && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 mb-8 flex items-start gap-4">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-300">
                Failed to compare answers
              </p>
              <p className="text-sm text-red-400/80 mt-1 break-words">
                {errorMsg}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
              aria-label="Retry"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────────── */}
        {appState === "results" && results && (
          <div ref={resultsRef} className="space-y-6 scroll-mt-6">
            {/* Scroll indicator */}
            <div className="flex flex-col items-center gap-1 text-slate-500 text-xs animate-bounce">
              <ChevronDown className="h-4 w-4" />
              Results below
            </div>

            {/* Subject mismatch warning */}
            {results.stats.missingInKey > results.stats.total * 0.7 && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-300">
                    Possible subject mismatch
                  </p>
                  <p className="text-sm text-amber-400/80 mt-1">
                    {results.stats.missingInKey} of {results.stats.total} questions from your Response Sheet were
                    not found in the Answer Key. This usually means you uploaded an Answer Key for a
                    different subject or paper. Please ensure both PDFs are for the same subject.
                  </p>
                </div>
              </div>
            )}

            <SummaryCard stats={results.stats} />
            <ResultsTable results={results.results} />

            {/* Reset button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 text-sm font-medium transition-all duration-200 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Check Another Sheet
              </button>
            </div>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="mt-16 text-center text-xs text-slate-600">
          <p>
            CUET Marks Checker · Files are processed server-side and never
            stored.
          </p>
        </footer>
      </div>
    </main>
  );
}
