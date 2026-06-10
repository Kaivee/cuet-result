"use client";

import React, { useState, useMemo } from "react";
import type { ComparisonResult, QuestionStatus } from "@/types";
import { CheckCircle, XCircle, MinusCircle, AlertCircle, ChevronUp, ChevronDown, Filter } from "lucide-react";

interface ResultsTableProps {
  results: ComparisonResult[];
  onQuestionClick?: (result: ComparisonResult) => void;
}

type FilterStatus = "all" | QuestionStatus;
type SortField = "questionId" | "status";
type SortDir = "asc" | "desc";

const STATUS_CONFIG: Record<
  QuestionStatus,
  { label: string; icon: React.ReactNode; rowClass: string; badgeClass: string }
> = {
  correct: {
    label: "Correct",
    icon: <CheckCircle className="h-4 w-4 text-emerald-400" />,
    rowClass: "bg-emerald-500/5 hover:bg-emerald-500/10",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  },
  incorrect: {
    label: "Incorrect",
    icon: <XCircle className="h-4 w-4 text-red-400" />,
    rowClass: "bg-red-500/5 hover:bg-red-500/10",
    badgeClass: "bg-red-500/20 text-red-300 border border-red-500/30",
  },
  not_attempted: {
    label: "Skipped",
    icon: <MinusCircle className="h-4 w-4 text-slate-400" />,
    rowClass: "bg-slate-800/30 hover:bg-slate-700/30",
    badgeClass: "bg-slate-700/50 text-slate-400 border border-slate-600/40",
  },
  missing_in_key: {
    label: "Not in Key",
    icon: <AlertCircle className="h-4 w-4 text-amber-400" />,
    rowClass: "bg-amber-500/5 hover:bg-amber-500/10",
    badgeClass: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  },
};

const PAGE_SIZE = 25;

export default function ResultsTable({ results, onQuestionClick }: ResultsTableProps) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sortField, setSortField] = useState<SortField>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let data = filter === "all" ? results : results.filter((r) => r.status === filter);

    data = [...data].sort((a, b) => {
      let cmp = 0;
      if (sortField === "questionId") {
        cmp = a.questionId.localeCompare(b.questionId);
      } else {
        const order: Record<QuestionStatus, number> = {
          correct: 0,
          incorrect: 1,
          not_attempted: 2,
          missing_in_key: 3,
        };
        cmp = order[a.status] - order[b.status];
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return data;
  }, [results, filter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  const filterCounts = useMemo(() => {
    const counts: Partial<Record<QuestionStatus, number>> = {};
    for (const r of results) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    }
    return counts;
  }, [results]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 text-slate-600" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 text-violet-400" />
    ) : (
      <ChevronDown className="h-3 w-3 text-violet-400" />
    );
  };

  return (
    <div className="w-full rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm shadow-2xl overflow-hidden">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 p-4 sm:p-6 border-b border-slate-700/60">
        <div className="flex items-center gap-2 mr-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-400 font-medium">Filter:</span>
        </div>

        {(
          [
            "all",
            "correct",
            "incorrect",
            "not_attempted",
            "missing_in_key",
          ] as FilterStatus[]
        ).map((f) => {
          const cfg = f !== "all" ? STATUS_CONFIG[f as QuestionStatus] : null;
          const count =
            f === "all" ? results.length : filterCounts[f as QuestionStatus] ?? 0;
          if (count === 0 && f !== "all") return null;
          return (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                ${
                  filter === f
                    ? f === "all"
                      ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                      : cfg!.badgeClass + " ring-2 ring-white/20"
                    : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600/40"
                }
              `}
            >
              {cfg?.icon}
              {f === "all" ? "All" : cfg!.label}
              <span className="ml-0.5 opacity-70">({count})</span>
            </button>
          );
        })}

        <span className="ml-auto text-xs text-slate-500">
          Showing {filtered.length} of {results.length}
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/40">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-12">
                #
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 transition-colors select-none"
                onClick={() => toggleSort("questionId")}
              >
                <span className="flex items-center gap-1">
                  Question ID <SortIcon field="questionId" />
                </span>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Your Answer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Correct Answer
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 transition-colors select-none"
                onClick={() => toggleSort("status")}
              >
                <span className="flex items-center gap-1">
                  Result <SortIcon field="status" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {paginated.map((row, i) => {
              const cfg = STATUS_CONFIG[row.status];
              const rowNumber = (page - 1) * PAGE_SIZE + i + 1;
              return (
                <tr
                  key={row.questionId}
                  className={`transition-colors duration-150 ${cfg.rowClass}`}
                >
                  <td className="px-4 py-3 text-slate-500 tabular-nums text-xs">
                    {rowNumber}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tracking-tight">
                    {onQuestionClick ? (
                      <button
                        onClick={() => onQuestionClick(row)}
                        className="text-violet-400 hover:text-violet-300 hover:underline transition-all font-semibold text-left"
                        title="Click to view question"
                      >
                        {row.questionId}
                      </button>
                    ) : (
                      <span className="text-slate-300">{row.questionId}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-200 text-sm">
                    {row.yourAnswer}
                  </td>
                  <td className="px-4 py-3 text-slate-200 text-sm">
                    {row.correctAnswer}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badgeClass}`}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/60">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </button>
          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
