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
  'Xenova/TinyLlama-1.1B-Chat-v1.0': 650,
  'Xenova/Qwen1.5-0.5B-Chat': 300,
  'Xenova/Qwen1.5-1.8B-Chat': 1100,
  'Xenova/LLaMA-3.2-1B-Instruct': 1000,
  'Xenova/LLaMA-3.2-3B-Instruct': 2000,
  'Xenova/Phi-3-mini-4k-instruct': 2300,
  'onnx-community/Qwen2.5-1.5B-Instruct': 1165,
  'onnx-community/Qwen2.5-Coder-0.5B-Instruct': 945,
  'onnx-community/Qwen2.5-Coder-1.5B-Instruct': 1165,
  'onnx-community/Qwen2.5-Coder-3B-Instruct': 2400,
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

export interface CachedModelInfo {
  id: string;
  filesCount: number;
  totalSize: number;
}

export async function getCachedModelsList(): Promise<CachedModelInfo[]> {
  if (typeof window === 'undefined') return [];
  try {
    const cacheNames = await caches.keys();
    const modelMap: Record<string, { filesCount: number; totalSize: number }> = {};

    for (const cacheName of cacheNames) {
      if (!cacheName.toLowerCase().includes('huggingface') && !cacheName.toLowerCase().includes('transformers')) {
        continue;
      }
      try {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        for (const req of requests) {
          const urlStr = req.url;
          let match = urlStr.match(/(?:huggingface\.co|api\/huggingface)\/(.*?)\/resolve\/main\//);
          if (match && match[1]) {
            const modelId = match[1];
            if (!modelMap[modelId]) {
              modelMap[modelId] = { filesCount: 0, totalSize: 0 };
            }
            modelMap[modelId].filesCount += 1;
            try {
              const res = await cache.match(req);
              if (res) {
                const len = res.headers.get('content-length');
                if (len) {
                  modelMap[modelId].totalSize += parseInt(len, 10);
                }
              }
            } catch (err) {
              console.error('Error reading cache response header:', err);
            }
          }
        }
      } catch (err) {
        console.error('Error scanning cache:', err);
      }
    }

    return Object.entries(modelMap).map(([id, data]) => ({
      id,
      filesCount: data.filesCount,
      totalSize: data.totalSize,
    }));
  } catch (e) {
    console.error('Failed to get cache list:', e);
    return [];
  }
}

export async function deleteModelFromCache(modelId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const cacheNames = await caches.keys();
    let deletedAny = false;

    for (const cacheName of cacheNames) {
      if (!cacheName.toLowerCase().includes('huggingface') && !cacheName.toLowerCase().includes('transformers')) {
        continue;
      }
      try {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        for (const req of requests) {
          const urlStr = req.url;
          if (urlStr.includes(`/${modelId}/resolve/`)) {
            await cache.delete(req);
            deletedAny = true;
          }
        }
      } catch (err) {
        console.error('Error deleting from cache:', err);
      }
    }
    return deletedAny;
  } catch (e) {
    console.error('Failed to delete from cache:', e);
    return false;
  }
}
