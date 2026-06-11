export type ModelLoadErrorType =
  | 'unavailable'
  | 'auth'
  | 'forbidden'
  | 'network'
  | 'memory'
  | 'webgpu'
  | 'unknown';

export type ModelLoadErrorInfo = {
  message: string;
  reason: string;
  errorType: ModelLoadErrorType;
  suggestModelLibrary: boolean;
};

export function parseModelLoadError(
  error: string,
  errorType?: ModelLoadErrorType
): ModelLoadErrorInfo {
  const lower = (error || '').toLowerCase();
  const type: ModelLoadErrorType =
    errorType ||
    (lower.includes('array buffer allocation failed') || lower.includes('out of memory') || lower.includes('allocation failed') || lower.includes('aborted()') || lower.includes('-sassertions')
      ? 'memory'
      : lower.includes('could not locate file') || lower.includes('404') || lower.includes('invalid model id')
        ? 'unavailable'
        : lower.includes('unauthorized') || lower.includes('401')
          ? 'auth'
          : lower.includes('forbidden') || lower.includes('403')
            ? 'forbidden'
            : lower.includes('requires webgpu')
              ? 'webgpu'
              : lower.includes('cannot reach') || lower.includes('proxy') || lower.includes('internet')
                ? 'network'
                : 'unknown');

  switch (type) {
    case 'unavailable':
      return {
        message: 'Model not available',
        reason:
          'This model is missing on Hugging Face or no longer supported. Please choose a different model — TinyLlama 1.1B Chat and LLaMA 3.2 3B Instruct are reliable options.',
        errorType: type,
        suggestModelLibrary: true,
      };
    case 'auth':
      return {
        message: 'Hugging Face token required',
        reason:
          'Add HUGGING_FACE_TOKEN to your .env file and restart the dev server, or paste your hf_ token in API Keys.',
        errorType: type,
        suggestModelLibrary: false,
      };
    case 'forbidden':
      return {
        message: 'Model access denied',
        reason:
          'Accept the model license on huggingface.co (same account as your token), then try downloading again.',
        errorType: type,
        suggestModelLibrary: true,
      };
    case 'network':
      return {
        message: 'Cannot download model',
        reason:
          'Make sure `npm run dev` is running and you are online for the first download.',
        errorType: type,
        suggestModelLibrary: false,
      };
    case 'webgpu':
      return {
        message: 'WebGPU required for this model',
        reason:
          'Models over ~1.5 GB need WebGPU to run in the browser. Use Chrome 113+ or Edge 113+ with hardware acceleration on, or choose a smaller model (TinyLlama 1.1B, Qwen 0.5B, LaMini 124M).',
        errorType: type,
        suggestModelLibrary: true,
      };
    case 'memory':
      return {
        message: lower.includes('aborted()') ? 'Model runtime failed (WASM/WebGPU)' : 'Not enough browser memory',
        reason: lower.includes('aborted()')
          ? 'The ONNX runtime crashed while loading this model — usually too large for WASM or not enough RAM. Use Chrome/Edge (WebGPU), close other tabs, then try a smaller model: LaMini GPT 124M (~250 MB), Qwen 0.5B (~300 MB), or TinyLlama 1.1B (~650 MB).'
          : 'This model is too large for your available RAM. Close other tabs and apps, then retry — or switch to a smaller model like LaMini GPT 124M (~250 MB), Qwen 0.5B (~300 MB), or TinyLlama 1.1B (~650 MB).',
        errorType: type,
        suggestModelLibrary: true,
      };
    default:
      return {
        message: 'Model download failed',
        reason: error || 'An unexpected error occurred.',
        errorType: 'unknown',
        suggestModelLibrary: true,
      };
  }
}
