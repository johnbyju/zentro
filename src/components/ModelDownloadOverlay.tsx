'use client';

import React from 'react';
import { Cpu, Loader2 } from 'lucide-react';
import {
  formatBytes,
  type ModelDownloadProgressState,
} from '@/lib/modelDownloadProgress';

interface ModelDownloadOverlayProps {
  visible: boolean;
  modelName: string;
  progress: ModelDownloadProgressState;
}

export default function ModelDownloadOverlay({
  visible,
  modelName,
  progress,
}: ModelDownloadOverlayProps) {
  if (!visible) return null;

  const shortFile = progress.currentFile
    ? progress.currentFile.split('/').pop() || progress.currentFile
    : '';

  const hasExpectedTotal = progress.total > 0;
  const displayLoaded = hasExpectedTotal
    ? Math.min(progress.loaded, progress.total)
    : progress.loaded;
  const overallLabel = hasExpectedTotal
    ? `${formatBytes(displayLoaded)} of ${formatBytes(progress.total)}`
    : displayLoaded > 0
      ? `${formatBytes(displayLoaded)} downloaded`
      : 'Starting download...';

  const isCompiling =
    progress.phase === 'compile' ||
    (hasExpectedTotal && progress.total > 0 && displayLoaded >= progress.total * 0.95 && progress.percent >= 88);

  const currentFileLabel = (() => {
    if (isCompiling) return null;
    if (!shortFile) return null;
    if (progress.currentFileTotal > progress.currentFileLoaded) {
      return `${shortFile} · ${formatBytes(progress.currentFileLoaded)} / ${formatBytes(progress.currentFileTotal)}`;
    }
    if (progress.currentFileLoaded > 0) {
      return `${shortFile} · ${formatBytes(progress.currentFileLoaded)}`;
    }
    return shortFile;
  })();

  const phaseLabel = isCompiling
    ? 'Compiling model for WebGPU...'
    : progress.phase === 'ready'
      ? 'Model ready'
      : shortFile
        ? `Downloading ${shortFile}`
        : 'Downloading model files...';

  const hint = isCompiling
      ? 'Weights are cached. This step prepares the model for local inference.'
      : hasExpectedTotal
        ? 'Large weight files can take several minutes. Keep this tab open.'
        : 'Keep this tab open while weights download.';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(7,9,20,0.88)', backdropFilter: 'blur(10px)' }}
    >
      <div className="w-[min(92vw,480px)] rounded-2xl border border-white/[0.08] bg-[#0b0c18] shadow-[0_24px_80px_rgba(0,0,0,0.65)] overflow-hidden">
        <div className="h-0.5 w-full bg-white/[0.04]">
          <div
            className="h-full bg-gradient-to-r from-[#3D5CFF] to-[#6DD3FF] transition-all duration-500 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3D5CFF]/10 border border-[#3D5CFF]/25 flex items-center justify-center shrink-0">
              {isCompiling || progress.phase === 'ready' ? (
                <Loader2 size={18} className="text-[#6DD3FF] animate-spin" />
              ) : (
                <Cpu size={18} className="text-[#6DD3FF]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white leading-tight truncate">{modelName}</p>
              <p className="text-[11px] text-slate-400 mt-1 truncate">{phaseLabel}</p>
            </div>
            <span className="text-2xl font-black text-[#6DD3FF] tabular-nums shrink-0">
              {progress.percent}%
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="h-3 rounded-full bg-[#070914] border border-white/[0.05] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#3D5CFF] via-[#5B7BFF] to-[#6DD3FF] transition-all duration-500 ease-out"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400">
              <span className="font-semibold text-slate-300">{overallLabel}</span>
              {progress.filesTotal > 0 && (
                <span className="shrink-0 text-slate-500">
                  {progress.filesDone} / {progress.filesTotal} files
                </span>
              )}
            </div>
          </div>

          {currentFileLabel && (
            <div className="rounded-lg bg-[#070914] border border-white/[0.05] px-3 py-2">
              <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Current file</p>
              <p className="text-[11px] text-slate-300 font-mono truncate">{currentFileLabel}</p>
            </div>
          )}

          <p className="text-[10px] text-slate-500 leading-relaxed">
            {progress.message || hint}
          </p>
        </div>
      </div>
    </div>
  );
}
