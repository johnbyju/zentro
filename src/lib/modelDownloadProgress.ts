export interface ModelDownloadProgressState {
  percent: number;
  loaded: number;
  total: number;
  currentFile: string;
  filesDone: number;
  filesTotal: number;
  phase: 'download' | 'compile' | 'ready';
  message: string;
}

export const INITIAL_MODEL_DOWNLOAD_PROGRESS: ModelDownloadProgressState = {
  percent: 0,
  loaded: 0,
  total: 0,
  currentFile: '',
  filesDone: 0,
  filesTotal: 0,
  phase: 'download',
  message: 'Preparing download...',
};

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;
  const decimals = unitIndex === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

export function parseWorkerDownloadEvent(data: {
  status?: string;
  message?: string;
  progress?: number;
  file?: string;
  loaded?: number;
  total?: number;
  filesDone?: number;
  filesTotal?: number;
  phase?: ModelDownloadProgressState['phase'];
}): Partial<ModelDownloadProgressState> | null {
  if (data.status !== 'progress') return null;

  return {
    percent: Math.max(0, Math.min(100, Math.round(data.progress ?? 0))),
    loaded: data.loaded ?? 0,
    total: data.total ?? 0,
    currentFile: data.file ?? '',
    filesDone: data.filesDone ?? 0,
    filesTotal: data.filesTotal ?? 0,
    phase: data.phase ?? 'download',
    message: data.message ?? 'Downloading model files...',
  };
}
