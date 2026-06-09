"use client";

import React, { useEffect, useRef, useState } from "react";
import type { SummaryStats } from "@/types";
import { Trophy, Target, X, Minus, AlertTriangle } from "lucide-react";

interface SummaryCardProps {
  stats: SummaryStats;
}

function AnimatedNumber({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const step = 16;
    const increments = Math.ceil(duration / step);
    const perStep = target / increments;
    let count = 0;

    const timer = setInterval(() => {
      count++;
      start += perStep;
      setDisplay(Math.min(Math.round(start), target));
      if (count >= increments) {
        setDisplay(target);
        clearInterval(timer);
      }
    }, step);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{display}</span>;
}

function CircleProgress({ percentage }: { percentage: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setProgress(percentage), 100);
    return () => clearTimeout(timeout);
  }, [percentage]);

  const color =
    percentage >= 60
      ? "#22c55e"
      : percentage >= 40
      ? "#f59e0b"
      : "#ef4444";

  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth="12"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1.2s ease-out, stroke 0.3s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-3xl font-black tabular-nums"
          style={{ color }}
        >
          <AnimatedNumber target={percentage} />%
        </span>
        <span className="text-xs text-slate-400 font-medium mt-0.5">
          Accuracy
        </span>
      </div>
    </div>
  );
}

export default function SummaryCard({ stats }: SummaryCardProps) {
  const scoreColor =
    stats.cuetScore > 0
      ? "text-emerald-400"
      : stats.cuetScore < 0
      ? "text-red-400"
      : "text-slate-400";

  return (
    <div className="w-full rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm shadow-2xl p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="rounded-2xl bg-violet-500/20 p-3 border border-violet-500/30">
          <Trophy className="h-6 w-6 text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Your Results</h2>
          <p className="text-sm text-slate-400">
            {stats.total} questions analysed
          </p>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Circle */}
        <div className="flex-shrink-0">
          <CircleProgress percentage={stats.percentage} />
        </div>

        {/* Stats grid */}
        <div className="flex-1 grid grid-cols-2 gap-4 w-full">
          {/* Correct */}
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/20 p-2">
              <Target className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-400 tabular-nums">
                <AnimatedNumber target={stats.correct} />
              </p>
              <p className="text-xs text-slate-400 font-medium">Correct</p>
            </div>
          </div>

          {/* Incorrect */}
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3">
            <div className="rounded-xl bg-red-500/20 p-2">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-red-400 tabular-nums">
                <AnimatedNumber target={stats.incorrect} />
              </p>
              <p className="text-xs text-slate-400 font-medium">Incorrect</p>
            </div>
          </div>

          {/* Not Attempted */}
          <div className="rounded-2xl bg-slate-700/40 border border-slate-600/40 p-4 flex items-center gap-3">
            <div className="rounded-xl bg-slate-600/40 p-2">
              <Minus className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-300 tabular-nums">
                <AnimatedNumber target={stats.notAttempted} />
              </p>
              <p className="text-xs text-slate-400 font-medium">Skipped</p>
            </div>
          </div>

          {/* CUET Score */}
          <div className="rounded-2xl bg-violet-500/10 border border-violet-500/20 p-4 flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/20 p-2">
              <Trophy className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className={`text-2xl font-black tabular-nums ${scoreColor}`}>
                <AnimatedNumber target={Math.abs(stats.cuetScore)} />
                {stats.cuetScore < 0 && (
                  <span className="text-red-400"> (−)</span>
                )}
              </p>
              <p className="text-xs text-slate-400 font-medium">CUET Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scoring legend */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center sm:justify-start">
        <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          +5 correct
        </span>
        <span className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
          −1 wrong
        </span>
        <span className="text-xs px-3 py-1 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/40">
          0 skipped
        </span>
        {stats.missingInKey > 0 && (
          <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {stats.missingInKey} not in key
          </span>
        )}
      </div>
    </div>
  );
}
