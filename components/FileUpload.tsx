"use client";

import React, { useCallback, useRef, useState } from "react";
import { FileText, Upload, X, CheckCircle } from "lucide-react";

interface FileUploadProps {
  label: string;
  description: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  id: string;
  accentColor: "violet" | "indigo";
}

export default function FileUpload({
  label,
  description,
  file,
  onFileChange,
  id,
  accentColor,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accent =
    accentColor === "violet"
      ? {
          border: "border-violet-500",
          bg: "bg-violet-500/10",
          text: "text-violet-400",
          badge: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
          ring: "ring-violet-500/50",
          icon: "text-violet-400",
          glow: "shadow-violet-500/20",
        }
      : {
          border: "border-indigo-500",
          bg: "bg-indigo-500/10",
          text: "text-indigo-400",
          badge: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
          ring: "ring-indigo-500/50",
          icon: "text-indigo-400",
          glow: "shadow-indigo-500/20",
        };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped && dropped.name.toLowerCase().endsWith(".pdf")) {
        onFileChange(dropped);
      }
    },
    [onFileChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) onFileChange(selected);
      e.target.value = "";
    },
    [onFileChange]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
        {label}
      </label>
      <p className="text-xs text-slate-400 -mt-1">{description}</p>

      {file ? (
        /* ── File Selected State ─────────────────────────────────────────── */
        <div
          className={`relative flex items-center gap-4 rounded-2xl border ${accent.border} ${accent.bg} p-4 shadow-lg ${accent.glow} transition-all duration-300`}
        >
          <div className={`rounded-xl p-3 ${accent.badge}`}>
            <FileText className={`h-6 w-6 ${accent.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-100 truncate">
              {file.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatSize(file.size)}
            </p>
          </div>
          <CheckCircle className={`h-5 w-5 ${accent.text} flex-shrink-0`} />
          <button
            onClick={() => onFileChange(null)}
            className="absolute -top-2 -right-2 rounded-full bg-slate-700 border border-slate-600 p-1 hover:bg-red-500/80 hover:border-red-500 transition-all duration-200"
            aria-label="Remove file"
          >
            <X className="h-3 w-3 text-slate-300" />
          </button>
        </div>
      ) : (
        /* ── Drop Zone ───────────────────────────────────────────────────── */
        <div
          id={id}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 cursor-pointer
            transition-all duration-300 group
            ${
              isDragging
                ? `${accent.border} ${accent.bg} ring-4 ${accent.ring} scale-[1.02]`
                : "border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800"
            }
          `}
        >
          <div
            className={`rounded-2xl p-4 transition-all duration-300 ${
              isDragging ? accent.bg : "bg-slate-700/50 group-hover:bg-slate-700"
            }`}
          >
            <Upload
              className={`h-8 w-8 transition-all duration-300 ${
                isDragging ? accent.text : "text-slate-400 group-hover:text-slate-300"
              }`}
            />
          </div>
          <div className="text-center">
            <p
              className={`text-sm font-medium transition-colors duration-200 ${
                isDragging ? accent.text : "text-slate-300"
              }`}
            >
              {isDragging ? "Drop it here!" : "Drag & drop or click to browse"}
            </p>
            <p className="text-xs text-slate-500 mt-1">PDF files only</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            onChange={handleInputChange}
            className="sr-only"
            aria-label={`Upload ${label}`}
          />
        </div>
      )}
    </div>
  );
}
