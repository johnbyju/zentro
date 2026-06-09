// Web Worker for client-side local LLM using Transformers.js v3
// IMPORTANT: This worker must be initialized with { type: 'module' }

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.2';

// ── Environment ────────────────────────────────────────────────────────────
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = 1;

// ── State ──────────────────────────────────────────────────────────────────
let generator = null;
let currentModelName = '';
let isLoading = false;

// ── Chat-template fallback ─────────────────────────────────────────────────
// Converts message array → plain string for models without a chat template
function messagesToString(messages) {
  let prompt = '';
  for (const m of messages) {
    if (m.role === 'system') prompt += `### System:\n${m.content}\n\n`;
    else if (m.role === 'user') prompt += `### User:\n${m.content}\n\n`;
    else if (m.role === 'assistant') prompt += `### Assistant:\n${m.content}\n\n`;
  }
  prompt += '### Assistant:\n';
  return prompt;
}

// Run generator — tries chat template, falls back to string prompt
async function runGenerator(messages, opts) {
  try {
    const output = await generator(messages, opts);
    const raw = output?.[0]?.generated_text;
    return Array.isArray(raw)
      ? (raw[raw.length - 1]?.content || '').trim()
      : (typeof raw === 'string' ? raw.trim() : '');
  } catch (err) {
    const msg = err?.message || '';
    if (msg.includes('chat_template') || msg.includes('apply_chat_template')) {
      // Fallback: plain string prompt
      const plainPrompt = messagesToString(messages);
      const output = await generator(plainPrompt, { ...opts, return_full_text: false });
      const raw = output?.[0]?.generated_text;
      // Cut off at next "### User" to avoid rambling
      const text = (typeof raw === 'string' ? raw : '').trim();
      const cutoff = text.indexOf('### User');
      return cutoff > 0 ? text.substring(0, cutoff).trim() : text;
    }
    throw err;
  }
}

// ── Message Handler ────────────────────────────────────────────────────────
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  // ── LOAD ──────────────────────────────────────────────────────────────────
  if (type === 'load') {
    if (isLoading) return;

    const modelName = (data && data.model) ? data.model : 'Xenova/TinyLlama-1.1B-Chat-v1.0';

    if (generator && currentModelName === modelName) {
      self.postMessage({ status: 'ready', message: 'Local AI ready (cached)!' });
      return;
    }

    isLoading = true;
    generator = null;

    try {
      const shortName = modelName.split('/').pop();
      self.postMessage({ status: 'loading', message: `Preparing ${shortName}...` });

      const progressCallback = (info) => {
        if (info.status === 'initiate') {
          self.postMessage({ status: 'loading', message: `Fetching: ${info.file}` });
        } else if (info.status === 'progress') {
          const pct = info.progress != null ? Math.round(info.progress) : 0;
          self.postMessage({ status: 'progress', file: info.file, progress: pct, loaded: info.loaded || 0, total: info.total || 0 });
        } else if (info.status === 'done') {
          self.postMessage({ status: 'loading', message: `Loaded: ${info.file}` });
        }
      };

      // Try quantized formats in order
      const dtypesToTry = ['q4', 'q8', 'fp32'];
      let lastError = null;
      for (const dtype of dtypesToTry) {
        try {
          self.postMessage({ status: 'loading', message: `Loading (${dtype})...` });
          generator = await pipeline('text-generation', modelName, { progress_callback: progressCallback, dtype });
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
          generator = null;
        }
      }

      if (!generator) throw lastError || new Error('All formats failed');

      currentModelName = modelName;
      isLoading = false;
      self.postMessage({ status: 'ready', message: `${shortName} ready — fully offline!` });

    } catch (err) {
      isLoading = false;
      generator = null;
      self.postMessage({ status: 'error', error: `Load failed: ${err?.message || String(err)}` });
    }
  }

  // ── GENERATE (workspace) ───────────────────────────────────────────────────
  if (type === 'generate') {
    if (!generator) {
      self.postMessage({ status: 'error', error: 'Model not loaded. Click "Initialize Local AI" first.' });
      return;
    }
    try {
      self.postMessage({ status: 'generating', token: 'Generating code...\n' });
      const { prompt } = data;

      const messages = [
        { role: 'system', content: 'You are an expert web developer. Generate clean, working HTML, CSS, and JavaScript for the user\'s request. Always wrap code in ```html, ```css, and ```javascript fenced blocks. Be concise and focused.' },
        { role: 'user', content: prompt }
      ];

      const result = await runGenerator(messages, {
        max_new_tokens: 600,
        temperature: 0.3,
        do_sample: false,
        return_full_text: false,
      });

      self.postMessage({ status: 'complete', result });
    } catch (err) {
      self.postMessage({ status: 'error', error: `Generation failed: ${err?.message || String(err)}` });
    }
  }

  // ── CHAT (assistant) ───────────────────────────────────────────────────────
  if (type === 'chat') {
    if (!generator) {
      self.postMessage({ status: 'error', error: 'Model not loaded. Click "Initialize Local AI" first.' });
      return;
    }
    try {
      self.postMessage({ status: 'generating', token: '' });
      const { prompt, history, systemPrompt } = data;

      const messages = [
        { role: 'system', content: systemPrompt || 'You are a helpful, accurate, and concise AI assistant. Answer questions directly and correctly. If asked a math question, compute the exact answer.' }
      ];

      if (history && history.length > 0) {
        // Only include last 6 messages to avoid context overflow on small models
        const recent = history.slice(-6);
        for (const m of recent) {
          messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
        }
      }
      messages.push({ role: 'user', content: prompt });

      const result = await runGenerator(messages, {
        max_new_tokens: 300,
        temperature: 0.1,   // Low temperature = more focused, less hallucination
        do_sample: false,   // Greedy decoding = most accurate
        return_full_text: false,
      });

      self.postMessage({ status: 'complete', result: result || '(no response generated)' });
    } catch (err) {
      self.postMessage({ status: 'error', error: `Chat failed: ${err?.message || String(err)}` });
    }
  }
});
