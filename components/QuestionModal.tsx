"use client";

import React, { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

if (typeof window !== "undefined") {
  const version = pdfjs.version || "5.4.296";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
}

interface QuestionModalProps {
  file: File;
  pageNumber: number;
  questionId: string;
  onClose: () => void;
}

export default function QuestionModal({
  file,
  pageNumber,
  questionId,
  onClose,
}: QuestionModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1.5);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let pdfDoc: any = null;

    async function loadAndRender() {
      setLoading(true);
      setError(null);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;
        pdfDoc = pdf;

        if (isCancelled) return;

        const page = await pdf.getPage(pageNumber);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;
        if (!isCancelled) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error rendering page in modal:", err);
        if (!isCancelled) {
          setError("Failed to render PDF page. Ensure the file is not corrupted.");
          setLoading(false);
        }
      }
    }

    loadAndRender();

    return () => {
      isCancelled = true;
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [file, pageNumber, scale]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Question Viewer
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              ID: {questionId} · Page {pageNumber} of {file.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-850 border border-slate-700/60 p-1">
              <button
                onClick={() => setScale((s) => Math.max(0.8, s - 0.2))}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-450 hover:text-white transition-colors"
                title="Zoom Out"
                disabled={loading}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-semibold text-slate-305 px-2 tabular-nums">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-455 hover:text-white transition-colors"
                title="Zoom In"
                disabled={loading}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/20 flex justify-center items-start min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/60 backdrop-blur-sm z-10">
              <RotateCw className="h-8 w-8 text-violet-500 animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Rendering PDF Page...</p>
            </div>
          )}

          {error ? (
            <div className="text-center p-8 max-w-md">
              <p className="text-red-405 text-sm font-semibold mb-2">Error Loading Question</p>
              <p className="text-slate-400 text-xs">{error}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800/85 bg-white shadow-xl overflow-hidden p-2 max-w-full">
              <canvas ref={canvasRef} className="max-w-full h-auto rounded-xl" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
