export interface ModelDownloadProgressState {
  percent: number;
  loaded: number;
  total: number;
  currentFile: string;
  currentFileLoaded: number;
  currentFileTotal: number;
  filesDone: number;
  filesTotal: number;
  phase: 'download' | 'compile' | 'ready';
  message: string;
}

export const LOCAL_MODEL_STORAGE_KEY = 'zentro-local-model';
export const LOCAL_MODEL_READY_KEY = 'zentro-local-model-ready';

export function getSavedLocalModelState(): { modelId: string | null; wasReady: boolean } {
  if (typeof window === 'undefined') {
    return { modelId: null, wasReady: false };
  }
  return {
    modelId: localStorage.getItem(LOCAL_MODEL_STORAGE_KEY),
    wasReady: localStorage.getItem(LOCAL_MODEL_READY_KEY) === 'true',
  };
}

export function markLocalModelReady(modelId: string) {
  localStorage.setItem(LOCAL_MODEL_STORAGE_KEY, modelId);
  localStorage.setItem(LOCAL_MODEL_READY_KEY, 'true');
}

export function clearLocalModelReady() {
  localStorage.removeItem(LOCAL_MODEL_READY_KEY);
}

export function getStoredHfToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('zentro-key-huggingface') || '';
}

export const INITIAL_MODEL_DOWNLOAD_PROGRESS: ModelDownloadProgressState = {
  percent: 0,
  loaded: 0,
  total: 0,
  currentFile: '',
  currentFileLoaded: 0,
  currentFileTotal: 0,
  filesDone: 0,
  filesTotal: 0,
  phase: 'download',
  message: 'Preparing download...',
};

/** Approximate download sizes used for overall progress when per-file totals are unreliable. */
export const MODEL_DOWNLOAD_SIZES_MB: Record<string, number> = {
  'Xenova/LaMini-GPT-124M': 250,
  'Xenova/gpt2': 250,
  'Xenova/distilgpt2': 170,
  'Xenova/TinyLlama-1.1B-Chat-v1.0': 650,
  'Xenova/Qwen1.5-0.5B-Chat': 300,
  'Xenova/Qwen1.5-1.8B-Chat': 1100,
  'Xenova/LLaMA-3.2-1B-Instruct': 1000,
  'Xenova/LLaMA-3.2-3B-Instruct': 2000,
  'Xenova/Phi-3-mini-4k-instruct': 2300,
  'onnx-community/Qwen2.5-1.5B-Instruct': 1165,
  'onnx-community/Qwen2.5-Coder-1.5B-Instruct': 1165,
  'onnx-community/Qwen2.5-Coder-3B-Instruct': 2400,
  'Xenova/bloom-560m': 560,
};

export function getModelExpectedBytes(modelId: string): number {
  const sizeMB = MODEL_DOWNLOAD_SIZES_MB[modelId];
  return sizeMB ? sizeMB * 1024 * 1024 : 0;
}

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
  activeLoaded?: number;
  activeTotal?: number;
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
    currentFileLoaded: data.activeLoaded ?? 0,
    currentFileTotal: data.activeTotal ?? 0,
    filesDone: data.filesDone ?? 0,
    filesTotal: data.filesTotal ?? 0,
    phase: data.phase ?? 'download',
    message: data.message ?? 'Downloading model files...',
  };
}
