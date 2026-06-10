"use client";

import React from "react";
import type { SubjectStats } from "@/types";
import { BookOpen, Check, AlertTriangle, Minus } from "lucide-react";

interface SubjectBreakdownProps {
  subjectStats: SubjectStats[];
  selectedSubject: string;
  onSelectSubject: (subject: string) => void;
}

export default function SubjectBreakdown({
  subjectStats,
  selectedSubject,
  onSelectSubject,
}: SubjectBreakdownProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-300 tracking-wide uppercase">
          Subject-wise Performance
        </h3>
        {selectedSubject !== "All" && (
          <button
            onClick={() => onSelectSubject("All")}
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjectStats.map((item) => {
          const isSelected = selectedSubject === item.subject;
          const scoreColor =
            item.stats.cuetScore > 0
              ? "text-emerald-400"
              : item.stats.cuetScore < 0
              ? "text-red-400"
              : "text-slate-400";

          const accuracyColorClass =
            item.stats.percentage >= 60
              ? "bg-emerald-500"
              : item.stats.percentage >= 40
              ? "bg-amber-500"
              : "bg-red-500";

          return (
            <div
              key={item.subject}
              onClick={() => onSelectSubject(isSelected ? "All" : item.subject)}
              className={`
                relative p-5 rounded-2xl border cursor-pointer transition-all duration-300 select-none
                ${
                  isSelected
                    ? "border-violet-500 bg-violet-600/10 shadow-lg shadow-violet-500/10 scale-[1.02]"
                    : "border-slate-700/60 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/80 hover:scale-[1.01]"
                }
              `}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-200 truncate flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-violet-400 flex-shrink-0" />
                    {item.subject}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {item.stats.total} questions
                  </p>
                </div>
                <div className={`text-xl font-black tabular-nums ${scoreColor}`}>
                  {item.stats.cuetScore > 0 ? "+" : ""}
                  {item.stats.cuetScore}
                </div>
              </div>

              {/* Accuracy progress bar */}
              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-[10px] font-medium text-slate-400">
                  <span>Accuracy</span>
                  <span className="text-slate-300 font-semibold">{item.stats.percentage}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${accuracyColorClass}`}
                    style={{ width: `${item.stats.percentage}%` }}
                  />
                </div>
              </div>

              {/* Score Breakdown metrics */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-700/40">
                <span className="flex items-center gap-1 text-emerald-500/90 font-medium">
                  <Check className="h-3.5 w-3.5" />
                  {item.stats.correct}
                </span>
                <span className="flex items-center gap-1 text-red-500/90 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {item.stats.incorrect}
                </span>
                <span className="flex items-center gap-1 text-slate-400 font-medium">
                  <Minus className="h-3.5 w-3.5" />
                  {item.stats.notAttempted}
                </span>
              </div>

              {/* selection overlay border */}
              {isSelected && (
                <div className="absolute inset-0 border border-violet-500/50 rounded-2xl pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
