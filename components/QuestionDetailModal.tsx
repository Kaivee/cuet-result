"use client";

import React, { useState, useEffect } from "react";
import type { ComparisonResult } from "@/types";
import { X, CheckCircle2, XCircle, MinusCircle, AlertCircle, HelpCircle, Loader2 } from "lucide-react";
import { extractQuestionImage } from "@/lib/extractQuestionImage";

interface QuestionDetailModalProps {
  result: ComparisonResult;
  responseSheets?: File[];
  onClose: () => void;
}

export default function QuestionDetailModal({
  result,
  responseSheets = [],
  onClose,
}: QuestionDetailModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isExtractingImage, setIsExtractingImage] = useState(false);

  useEffect(() => {
    async function fetchImage() {
      if (responseSheets.length === 0) return;
      setIsExtractingImage(true);
      try {
        const img = await extractQuestionImage(responseSheets[0], result.questionId);
        if (img) setImageUrl(img);
      } catch (err) {
        console.error("Failed to extract image", err);
      } finally {
        setIsExtractingImage(false);
      }
    }
    fetchImage();
  }, [result.questionId, responseSheets]);

  const {
    questionId,
    yourAnswer,
    correctAnswer,
    chosenOptionId,
    correctOptionId,
    status,
    subject,
    optionIds,
    chosenOptionIndex,
  } = result;

  // Render Status Badge
  const getStatusBadge = () => {
    switch (status) {
      case "correct":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Correct (+5 Marks)
          </span>
        );
      case "incorrect":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            <XCircle className="h-3.5 w-3.5" />
            Incorrect (−1 Mark)
          </span>
        );
      case "not_attempted":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-400 border border-slate-600/40">
            <MinusCircle className="h-3.5 w-3.5" />
            Skipped (0 Marks)
          </span>
        );
      case "missing_in_key":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
            <AlertCircle className="h-3.5 w-3.5" />
            Not in Key
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-2xl flex flex-col rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Question Details
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Subject: {subject}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
            aria-label="Close details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-800/40 border border-slate-800 p-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Question ID</span>
              <p className="text-sm font-mono font-semibold text-slate-200 mt-1">{questionId}</p>
            </div>
            <div className="rounded-2xl bg-slate-800/40 border border-slate-800 p-4 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Evaluation</span>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
          </div>

          {/* Question Text / Image */}
          {(result.questionText || isExtractingImage || imageUrl) && (
            <div className="rounded-2xl bg-slate-800/20 border border-slate-700/50 p-5">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Question Details
              </h4>
              
              {result.questionText && (
                <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed mb-4">
                  {result.questionText}
                </p>
              )}

              {isExtractingImage && (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting embedded images...
                </div>
              )}

              {imageUrl && !isExtractingImage && (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-700/50 bg-white p-2">
                  <img src={imageUrl} alt="Question Snippet" className="max-w-full h-auto object-contain" />
                </div>
              )}
            </div>
          )}

          {/* Options Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Options Breakdown
            </h4>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/20 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-500 uppercase bg-slate-800/10">
                    <th className="px-4 py-3 text-left w-24">Option</th>
                    <th className="px-4 py-3 text-left">Option ID</th>
                    <th className="px-4 py-3 text-right">Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {optionIds.map((optId, index) => {
                    const optionNum = index + 1;
                    const isChosen = chosenOptionIndex === optionNum;
                    const isCorrect = optId === correctOptionId;

                    let rowClass = "hover:bg-slate-805/20";
                    let matchBadge = null;

                    if (isChosen && isCorrect) {
                      rowClass = "bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300";
                      matchBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Your Choice & Correct
                        </span>
                      );
                    } else if (isChosen) {
                      rowClass = "bg-red-500/5 hover:bg-red-500/10 text-red-300";
                      matchBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          Your Choice
                        </span>
                      );
                    } else if (isCorrect && status !== "missing_in_key") {
                      rowClass = "bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300";
                      matchBadge = (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-400 border border-emerald-500/30">
                          Correct Answer
                        </span>
                      );
                    }

                    return (
                      <tr key={optId} className={`transition-colors ${rowClass}`}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-350">Option {optionNum}</div>
                          {result.optionsText && result.optionsText[index] && (
                            <div className="mt-1 text-sm text-slate-300 whitespace-pre-wrap">
                              {result.optionsText[index]}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400 align-top">
                          {optId || <span className="italic text-slate-600">ID not found</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {matchBadge}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Summary Alert */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 flex items-start gap-3">
            <HelpCircle className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />
            <div className="leading-normal space-y-1">
              {status === "correct" && (
                <p>
                  You chose <span className="font-semibold text-emerald-400">{yourAnswer}</span>, which matches the official answer key option ID <span className="font-mono text-slate-200">{correctOptionId}</span>.
                </p>
              )}
              {status === "incorrect" && (
                <p>
                  You chose <span className="font-semibold text-red-400">{yourAnswer}</span>. However, the official answer key specifies the correct option is <span className="font-semibold text-emerald-400">{correctAnswer}</span> (ID: <span className="font-mono text-slate-200">{correctOptionId}</span>).
                </p>
              )}
              {status === "not_attempted" && (
                <p>
                  You did not attempt this question. The official answer key correct option is <span className="font-semibold text-slate-300">{correctAnswer}</span> (ID: <span className="font-mono text-slate-200">{correctOptionId}</span>).
                </p>
              )}
              {status === "missing_in_key" && (
                <p>
                  This question ID was not found in the uploaded Answer Key. It has been excluded from scoring. Please verify that your answer key PDF matches the subject of this response sheet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
