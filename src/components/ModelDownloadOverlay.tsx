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
    : 'model weights';

  const hasByteTotals = progress.total > 0;
  const sizeLabel = hasByteTotals
    ? `${formatBytes(progress.loaded)} of ${formatBytes(progress.total)}`
    : progress.filesTotal > 0
      ? `${progress.filesDone} of ${progress.filesTotal} files`
      : 'Calculating size...';

  const phaseLabel =
    progress.phase === 'compile'
      ? 'Compiling model for WebGPU...'
      : `Downloading ${shortFile}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(7,9,20,0.88)', backdropFilter: 'blur(10px)' }}
    >
      <div className="w-[min(92vw,460px)] rounded-2xl border border-white/[0.08] bg-[#0b0c18] shadow-[0_24px_80px_rgba(0,0,0,0.65)] overflow-hidden">
        <div className="h-0.5 w-full bg-white/[0.04]">
          <div
            className="h-full bg-gradient-to-r from-[#3D5CFF] to-[#6DD3FF] transition-all duration-300 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3D5CFF]/10 border border-[#3D5CFF]/25 flex items-center justify-center shrink-0">
              {progress.phase === 'compile' ? (
                <Loader2 size={18} className="text-[#6DD3FF] animate-spin" />
              ) : (
                <Cpu size={18} className="text-[#6DD3FF]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white leading-tight truncate">{modelName}</p>
              <p className="text-[11px] text-slate-400 mt-1">{phaseLabel}</p>
            </div>
            <span className="text-lg font-black text-[#6DD3FF] tabular-nums shrink-0">
              {progress.percent}%
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="h-2.5 rounded-full bg-[#070914] border border-white/[0.05] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#3D5CFF] via-[#5B7BFF] to-[#6DD3FF] transition-all duration-300 ease-out"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span className="truncate pr-3">{sizeLabel}</span>
              <span className="shrink-0">
                {progress.phase === 'compile' ? 'Almost ready' : 'Cached after first download'}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed">
            {progress.message || 'Keep this tab open while weights download. Large models can take a few minutes on slower connections.'}
          </p>
        </div>
      </div>
    </div>
  );
}
