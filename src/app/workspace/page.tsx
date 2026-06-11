'use client';

import React, { useState, useEffect, useRef } from 'react';
import { parseModelLoadError, type ModelLoadErrorType } from '@/lib/modelLoadErrors';
import {
  INITIAL_MODEL_DOWNLOAD_PROGRESS,
  LOCAL_MODEL_STORAGE_KEY,
  clearLocalModelReady,
  getModelExpectedBytes,
  getSavedLocalModelState,
  getStoredHfToken,
  markLocalModelReady,
  parseWorkerDownloadEvent,
  type ModelDownloadProgressState,
} from '@/lib/modelDownloadProgress';
import ModelDownloadOverlay from '@/components/ModelDownloadOverlay';
import JSZip from 'jszip';
import Link from 'next/link';
import {
  Bot,
  User,
  Send,
  Sparkles,
  FolderPlus,
  ChevronRight,
  Play,
  Cpu,
  Server,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Wrench,
  FileCode,
  Moon,
  Sun,
  Loader2,
  Trash2,
  Download,
  AlertTriangle,
  X,
  RefreshCcw,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  ExternalLink
} from 'lucide-react';
import {
  db,
  createNewChat,
  addMessageToChat,
  getChatMessages,
  getAllChats,
  deleteChat,
  type Chat,
  type Message
} from '../../services/db';

// Lazy load Monaco editor dynamically on client
import CodeEditor from '../../components/CodeEditor';
import PreviewFrame from '../../components/PreviewFrame';

export default function WorkspacePage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [promptInput, setPromptInput] = useState('');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  // Generator engine state
  const [engineMode, setEngineMode] = useState<'server' | 'local'>('local');
  const [generationActive, setGenerationActive] = useState(false);
  const [serverModel, setServerModel] = useState('gemini-2.5-flash');
  const [localModel, setLocalModel] = useState(() => {
    if (typeof window === 'undefined') return 'Xenova/TinyLlama-1.1B-Chat-v1.0';
    return localStorage.getItem(LOCAL_MODEL_STORAGE_KEY) || 'Xenova/TinyLlama-1.1B-Chat-v1.0';
  });

  // Monaco and Sandbox code content
  const [activeHtml, setActiveHtml] = useState('<!-- Enter or generate app layout -->\n<div class="hello"><h1>Zentro Core Ready</h1><p>Start a new chat or run code snippets.</p></div>');
  const [activeCss, setActiveCss] = useState('body { margin: 0; background: #fafafa; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; }\n.hello { text-align: center; color: #333; }');
  const [activeJs, setActiveJs] = useState('console.log("Console connection established");');

  // 5-Pass visual state tracking
  const [pipelinePass, setPipelinePass] = useState<number>(0);
  const [pipelineStatus, setPipelineStatus] = useState<Record<number, 'idle' | 'running' | 'success' | 'failed'>>({
    1: 'idle', 2: 'idle', 3: 'idle', 4: 'idle', 5: 'idle'
  });
  const [pipelineLogs, setPipelineLogs] = useState<Record<number, string>>({
    1: '', 2: '', 3: '', 4: '', 5: ''
  });

  // Local model state tracking
  const [localModelStatus, setLocalModelStatus] = useState<'idle' | 'loading' | 'progress' | 'ready' | 'error'>('idle');
  const [localModelMsg, setLocalModelMsg] = useState('Click to Download & Run Locally');
  const [localModelPercent, setLocalModelPercent] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState<ModelDownloadProgressState>(INITIAL_MODEL_DOWNLOAD_PROGRESS);
  const [isRestoringModel, setIsRestoringModel] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Ref to track the active chat ID synchronously (state updates are async, so this is reliable)
  const pendingChatIdRef = useRef<string | null>(null);
  const [errorPopup, setErrorPopup] = useState<{ visible: boolean; message: string; reason?: string }>({ visible: false, message: '' });
  const errorDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // API Key Settings Modal
  const [showApiModal, setShowApiModal] = useState(false);
  const [showLocalModelOnboarding, setShowLocalModelOnboarding] = useState(false);
  const [apiKeyTab, setApiKeyTab] = useState<'gemini' | 'groq' | 'openrouter' | 'huggingface'>('gemini');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyValue, setShowApiKeyValue] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [serverHfConfigured, setServerHfConfigured] = useState(false);

  // ─── API Key Helpers ───
  const loadApiKeys = () => {
    const stored: Record<string, string> = {};
    ['gemini', 'groq', 'openrouter', 'huggingface'].forEach(p => {
      const k = localStorage.getItem(`zentro-key-${p}`);
      if (k) stored[p] = k;
    });
    setApiKeys(stored);
  };

  const saveApiKey = () => {
    if (!apiKeyInput.trim()) return;
    localStorage.setItem(`zentro-key-${apiKeyTab}`, apiKeyInput.trim());
    setApiKeys(prev => ({ ...prev, [apiKeyTab]: apiKeyInput.trim() }));
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  };

  const removeApiKey = (provider: string) => {
    localStorage.removeItem(`zentro-key-${provider}`);
    setApiKeys(prev => { const n = { ...prev }; delete n[provider]; return n; });
    if (apiKeyTab === provider) setApiKeyInput('');
  };

  const resolveUserKeys = (): Record<string, string | undefined> => ({
    geminiKey: apiKeys['gemini'],
    groqKey: apiKeys['groq'],
    openrouterKey: apiKeys['openrouter'],
  });

  // Show styled popup error instead of native alert()
  const showError = (message: string, reason?: string) => {
    if (errorDismissRef.current) clearTimeout(errorDismissRef.current);
    setErrorPopup({ visible: true, message, reason });
    errorDismissRef.current = setTimeout(() => {
      setErrorPopup({ visible: false, message: '' });
    }, 8000);
  };

  const dismissError = () => {
    if (errorDismissRef.current) clearTimeout(errorDismissRef.current);
    setErrorPopup({ visible: false, message: '' });
  };

  // Initialize DB, layout, and Web Worker
  useEffect(() => {
    loadChatSessions();
    loadApiKeys();

    const fetchHfConfig = async () => {
      try {
        const res = await fetch('/api/config/huggingface');
        const data = await res.json();
        if (data.configured) {
          setServerHfConfigured(true);
        }
      } catch (err) {
        console.error('Failed to load Hugging Face config from server:', err);
      }
    };
    fetchHfConfig();

    // Check localStorage theme settings
    const savedTheme = localStorage.getItem('zentro-theme') as 'dark' | 'light';
    if (savedTheme) {
      setThemeMode(savedTheme);
      document.documentElement.classList.toggle('light', savedTheme === 'light');
    }

    // Register Service Worker for offline capability
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker registered:', reg.scope))
        .catch((err) => console.error('Service Worker registration failed:', err));
    }

    const { modelId: savedLocalModel, wasReady: savedModelReady } = getSavedLocalModelState();
    if (savedLocalModel) {
      setLocalModel(savedLocalModel);
      if (savedModelReady) {
        setLocalModelStatus('loading');
        setLocalModelMsg('Restoring cached model...');
        setIsRestoringModel(true);
      }
    }

    // Spawn AI Worker (must be type:module to support ES module imports in the worker)
    workerRef.current = new Worker('/ai-worker.js', { type: 'module' });

    workerRef.current.onmessage = (event) => {
      const { status, message, progress, token, error, result, pass, data, errorType, model: readyModel } = event.data;

      if (status === 'loading') {
        setLocalModelStatus('loading');
        setLocalModelMsg(message);
        setDownloadProgress((prev) => ({
          ...prev,
          phase: message?.toLowerCase().includes('compile') ? 'compile' : 'download',
          message: message || prev.message,
        }));
      } else if (status === 'progress') {
        setLocalModelStatus('progress');
        const parsed = parseWorkerDownloadEvent(event.data);
        if (parsed) {
          setDownloadProgress((prev) => ({ ...prev, ...parsed }));
          if (parsed.percent != null) setLocalModelPercent(parsed.percent);
          if (parsed.message) setLocalModelMsg(parsed.message);
        } else {
          const pct = Math.round(progress ?? 0);
          setLocalModelPercent(pct);
          setLocalModelMsg(`Downloading model files... ${pct}%`);
        }
      } else if (status === 'ready') {
        setLocalModelStatus('ready');
        setLocalModelMsg('Local AI Active (Ready offline)');
        setDownloadProgress(INITIAL_MODEL_DOWNLOAD_PROGRESS);
        setIsRestoringModel(false);
        const activeModel = readyModel || localStorage.getItem(LOCAL_MODEL_STORAGE_KEY);
        if (activeModel) {
          markLocalModelReady(activeModel);
          setLocalModel(activeModel);
        }
      } else if (status === 'pass_start') {
        setPipelinePass(pass);
        setPipelineStatus(prev => ({ ...prev, [pass]: 'running' }));
        setPipelineLogs(prev => ({ ...prev, [pass]: message || 'Processing...' }));
      } else if (status === 'pass_complete') {
        setPipelineStatus(prev => ({ ...prev, [pass]: 'success' }));
        if (pass === 1) {
          setPipelineLogs(prev => ({ ...prev, 1: `App Name: ${data.app}\nFeatures: ${data.features.join(', ')}` }));
        } else if (pass === 2) {
          setPipelineLogs(prev => ({ ...prev, 2: `Blueprint: ${data.steps.join('\n')}` }));
        } else if (pass === 3) {
          setPipelineLogs(prev => ({ ...prev, 3: `Code files synthesized.` }));
          setActiveHtml(data.html);
          setActiveCss(data.css);
          setActiveJs(data.js);
        } else if (pass === 4) {
          setPipelineLogs(prev => ({ ...prev, 4: `Audit: ${data.audit}\nPatches: ${data.patchesApplied.join(', ')}` }));
        } else if (pass === 5) {
          setPipelineLogs(prev => ({ ...prev, 5: `Responsive layouts and styles variables applied.` }));
          setActiveHtml(data.files.html);
          setActiveCss(data.files.css);
          setActiveJs(data.files.js);
        }
      } else if (status === 'generating') {
        // Dynamic logs inside pipeline
        setPipelineLogs(prev => ({
          ...prev,
          3: (prev[3] || '') + token
        }));
      } else if (status === 'complete') {
        handleLocalModelCompletion(result, pendingChatIdRef.current);
      } else if (status === 'error') {
        setLocalModelStatus('error');
        setDownloadProgress(INITIAL_MODEL_DOWNLOAD_PROGRESS);
        setIsRestoringModel(false);
        clearLocalModelReady();
        const info = parseModelLoadError(error || '', errorType as ModelLoadErrorType | undefined);
        setLocalModelMsg(info.message);
        setGenerationActive(false);
        showError(info.message, info.reason);
      }
    };

    if (savedLocalModel && savedModelReady) {
      workerRef.current.postMessage({
        type: 'load',
        data: {
          model: savedLocalModel,
          expectedSizeMB: Math.round(getModelExpectedBytes(savedLocalModel) / (1024 * 1024)) || 0,
          restore: true,
          useHfProxy: true,
          token: getStoredHfToken(),
          origin: window.location.origin,
        },
      });
    }

    // Catch worker-level errors (import failures, syntax errors, etc)
    workerRef.current.onerror = (err) => {
      console.error('[AI Worker Error]', err);
      setLocalModelStatus('error');
      setLocalModelMsg('Worker failed to load: ' + (err.message || 'Check console for details'));
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Sync scroll to chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat threads
  const loadChatSessions = async (selectFirst = false) => {
    const list = await getAllChats();
    const builderChats = list.filter(c => c.type !== 'assistant');
    setChats(builderChats);
    if (selectFirst && builderChats.length > 0) {
      handleSelectChat(builderChats[0].id!);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    const history = await getChatMessages(chatId);
    setMessages(history);

    // If chat history has assistant generated code, load it inside Monaco
    const codeMsg = [...history].reverse().find(m => m.role === 'assistant' && codeMsgContainsFiles(m));
    if (codeMsg && codeMsg.files) {
      setActiveHtml(codeMsg.files.html);
      setActiveCss(codeMsg.files.css);
      setActiveJs(codeMsg.files.js);
    }
  };

  const codeMsgContainsFiles = (m: Message) => {
    return !!(m.files && (m.files.html || m.files.css || m.files.js));
  };

  const handleCreateNewChat = async () => {
    const title = 'New Sandbox Session';
    const id = await createNewChat(title);
    await loadChatSessions();
    handleSelectChat(id);
  };

  const handleDeleteSession = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteChat(chatId);
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setMessages([]);
    }
    loadChatSessions();
  };

  // Switch dark/light themes
  const handleToggleTheme = () => {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);
    localStorage.setItem('zentro-theme', nextTheme);
    document.documentElement.classList.toggle('light', nextTheme === 'light');
  };

  // Handle change of selected local model
  const handleLocalModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setLocalModel(newModel);
    localStorage.setItem(LOCAL_MODEL_STORAGE_KEY, newModel);
    clearLocalModelReady();
    setLocalModelStatus('idle');
    setLocalModelMsg('Click to Download & Run Locally');
    setLocalModelPercent(0);
  };

  // Launch Local Model weight downloader
  const handleInitLocalModel = () => {
    if (localModelStatus === 'ready' || localModelStatus === 'loading' || localModelStatus === 'progress') return;
    clearLocalModelReady();
    setLocalModelPercent(0);
    setDownloadProgress({
      ...INITIAL_MODEL_DOWNLOAD_PROGRESS,
      total: getModelExpectedBytes(localModel),
    });
    const userHfToken = apiKeys['huggingface'] || '';
    workerRef.current?.postMessage({
      type: 'load',
      data: {
        model: localModel,
        expectedSizeMB: Math.round(getModelExpectedBytes(localModel) / (1024 * 1024)) || 0,
        useHfProxy: true,
        token: userHfToken,
        origin: window.location.origin,
      },
    });
  };

  // Monaco code editing sync with local IndexedDB autosave
  const handleCodeChange = async (file: 'html' | 'css' | 'js', value: string) => {
    let newHtml = activeHtml;
    let newCss = activeCss;
    let newJs = activeJs;

    if (file === 'html') {
      setActiveHtml(value);
      newHtml = value;
    } else if (file === 'css') {
      setActiveCss(value);
      newCss = value;
    } else {
      setActiveJs(value);
      newJs = value;
    }

    // Auto-save changes back to the active IndexedDB session's assistant message
    if (currentChatId && messages.length > 0) {
      const assistantMsgIdx = [...messages].reverse().findIndex(m => m.role === 'assistant');
      if (assistantMsgIdx !== -1) {
        const targetMsgIdx = messages.length - 1 - assistantMsgIdx;
        const targetMsg = messages[targetMsgIdx];
        if (targetMsg.id) {
          const updatedFiles = {
            html: newHtml,
            css: newCss,
            js: newJs
          };

          // Save to IndexedDB
          await db.messages.update(targetMsg.id, { files: updatedFiles });

          // Keep local state in sync
          setMessages(prev => {
            const copy = [...prev];
            copy[targetMsgIdx] = {
              ...copy[targetMsgIdx],
              files: updatedFiles
            };
            return copy;
          });
        }
      }
    }
  };

  // Download project files packaged inside a named ZIP folder to user's local disk
  const handleDownloadApp = async () => {
    const defaultName = chats.find(c => c.id === currentChatId)?.title || 'my-app';
    const folderName = prompt('Enter a name for your project folder:', defaultName);
    if (!folderName) return; // User cancelled

    const safeName = folderName.replace(/[^a-zA-Z0-9-_ ]/g, '-').trim() || 'my-app';
    const slugName = safeName.replace(/\s+/g, '-').toLowerCase();

    // Prepare HTML template that links external files
    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
${activeHtml}
  <script src="script.js"></script>
</body>
</html>`;

    try {
      const zip = new JSZip();

      // Place files inside a subfolder matching the project name
      const folder = zip.folder(slugName);
      if (folder) {
        folder.file('index.html', htmlTemplate);
        folder.file('style.css', activeCss);
        folder.file('script.js', activeJs);
      } else {
        zip.file('index.html', htmlTemplate);
        zip.file('style.css', activeCss);
        zip.file('script.js', activeJs);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slugName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate zip file', err);
      showError('Export failed', 'Could not generate the zip package. Please try again.');
    }
  };

  // Main prompt executor using string input
  const handleSendPromptText = async (text: string) => {
    if (!text.trim() || generationActive) return;

    let chatId = currentChatId;
    if (!chatId) {
      // Create chat dynamically if none is selected
      const summaryTitle = text.length > 28 ? text.substring(0, 25) + '...' : text;
      chatId = await createNewChat(summaryTitle);
      await loadChatSessions();
      setCurrentChatId(chatId);
    }

    const userMessage: Omit<Message, 'id'> = {
      chatId: chatId!,
      role: 'user',
      content: text,
      createdAt: Date.now()
    };

    await addMessageToChat(userMessage);
    const updatedHistory = await getChatMessages(chatId!);
    setMessages(updatedHistory);
    setPromptInput('');
    setGenerationActive(true);

    // Reset pipeline state visual indicators
    setPipelinePass(0);
    setPipelineStatus({ 1: 'idle', 2: 'idle', 3: 'idle', 4: 'idle', 5: 'idle' });
    setPipelineLogs({ 1: '', 2: '', 3: '', 4: '', 5: '' });

    if (engineMode === 'local') {
      if (localModelStatus !== 'ready') {
        setShowLocalModelOnboarding(true);
        setGenerationActive(false);
        return;
      }
      // Set pendingChatIdRef BEFORE posting to worker (state update is async)
      pendingChatIdRef.current = chatId;
      // Trigger Web Worker local generation
      workerRef.current?.postMessage({
        type: 'generate',
        data: { prompt: text }
      });
    } else {
      // Trigger Next.js API Server generation (streams 5-pass SSE)
      try {
        await executeServerPipeline(text, chatId!);
      } catch (err: any) {
        console.error('Server pipeline request error: ', err);
        setPromptInput(text); // Preserve user input precisely on error
        showError('Credits got over — quota exhausted!', err?.message || 'Network or provider error. Please try a different model.');
        setGenerationActive(false);
      }
    }
  };

  // Main prompt executor
  const handleSendPrompt = async () => {
    await handleSendPromptText(promptInput);
  };

  // Read response stream from Next.js server (SSE stream)
  const executeServerPipeline = async (promptText: string, chatId: string) => {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText, model: serverModel, userKeys: resolveUserKeys() }),
    });

    if (!response.ok) {
      throw new Error(`HTTP network error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    // Track output variables dynamically
    let genHtml = '';
    let genCss = '';
    let genJs = '';
    let p1Data = '';
    let p2Data = '';
    let p3Data = '';
    let p4Data = '';
    let p5Data = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.substring(6));
            const passNum = event.pass;
            setPipelinePass(passNum);

            if (event.status === 'start') {
              setPipelineStatus(prev => ({ ...prev, [passNum]: 'running' }));
              setPipelineLogs(prev => ({ ...prev, [passNum]: event.message }));
            } else if (event.status === 'complete') {
              setPipelineStatus(prev => ({ ...prev, [passNum]: 'success' }));

              if (passNum === 1) {
                p1Data = JSON.stringify(event.data, null, 2);
                setPipelineLogs(prev => ({ ...prev, 1: `App Name: ${event.data.app}\nFeatures: ${event.data.features.join(', ')}` }));
              } else if (passNum === 2) {
                p2Data = JSON.stringify(event.data, null, 2);
                setPipelineLogs(prev => ({ ...prev, 2: `Architecture details formulated:\n${event.data.steps.join('\n')}` }));
              } else if (passNum === 3) {
                genHtml = event.data.html;
                genCss = event.data.css;
                genJs = event.data.js;
                setPipelineLogs(prev => ({ ...prev, 3: `Code files successfully generated.` }));
                setActiveHtml(genHtml);
                setActiveCss(genCss);
                setActiveJs(genJs);
              } else if (passNum === 4) {
                p4Data = JSON.stringify(event.data, null, 2);
                setPipelineLogs(prev => ({ ...prev, 4: `Audit Review Output:\n${event.data.audit}\nPatches: ${event.data.patchesApplied.join(', ')}` }));
              } else if (passNum === 5) {
                p5Data = JSON.stringify(event.data, null, 2);
                setPipelineLogs(prev => ({ ...prev, 5: `UX modifications and responsiveness updates applied.` }));

                // Final code updates
                if (event.data.files) {
                  genHtml = event.data.files.html;
                  genCss = event.data.files.css;
                  genJs = event.data.files.js;
                  setActiveHtml(genHtml);
                  setActiveCss(genCss);
                  setActiveJs(genJs);
                }
              }
            } else if (event.status === 'error') {
              setPipelineStatus(prev => ({ ...prev, [passNum]: 'failed' }));
              setPipelineLogs(prev => ({ ...prev, [passNum]: `Error: ${event.message}` }));
              throw new Error(event.message || 'Error occurred during generation');
            }
          } catch (e) {
            console.error('SSE JSON parsing error: ', e);
          }
        }
      }
    }

    // Complete saving routine to DB
    const assistantMessage: Omit<Message, 'id'> = {
      chatId,
      role: 'assistant',
      content: `I have created the requested application using the 5-pass pipeline. You can review and edit the code files, check logs, and run it in the Preview screen.`,
      createdAt: Date.now(),
      passDetails: {
        pass1: p1Data,
        pass2: p2Data,
        pass3: p3Data,
        pass4: p4Data,
        pass5: p5Data
      },
      files: {
        html: genHtml,
        css: genCss,
        js: genJs
      }
    };

    await addMessageToChat(assistantMessage);
    const finalHistory = await getChatMessages(chatId);
    setMessages(finalHistory);
    setGenerationActive(false);
  };

  // Local model completed callback handler
  const handleLocalModelCompletion = async (result: string, chatId: string | null) => {
    // Use the passed chatId (from ref) - never rely on currentChatId state here
    const activeChatId = chatId;
    if (!activeChatId) {
      console.error('handleLocalModelCompletion: no chatId available');
      setGenerationActive(false);
      return;
    }

    // Parse model text to separate tags
    let html = '';
    let css = '';
    let js = '';

    if (result.includes('```html')) {
      html = result.split('```html')[1].split('```')[0].trim();
    }
    if (result.includes('```css')) {
      css = result.split('```css')[1].split('```')[0].trim();
    }
    if (result.includes('```javascript') || result.includes('```js')) {
      const key = result.includes('```javascript') ? '```javascript' : '```js';
      js = result.split(key)[1].split('```')[0].trim();
    }

    // If parsing failed to find blocks, generate a basic default layout using the prompt keywords
    if (!html) {
      html = `<!DOCTYPE html>\n<html>\n<head>\n<title>Local AI Sandbox</title>\n</head>\n<body>\n<div class="card"><h1>Local App Generated</h1><p>${result.substring(0, 100)}...</p></div>\n</body>\n</html>`;
      css = `body { background: #111; color: #00ffcc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; }\n.card { border: 1px solid #00ffcc; padding: 20px; border-radius: 8px; }`;
      js = `console.log("Local WebGPU render successful.");`;
    }

    setActiveHtml(html);
    setActiveCss(css);
    setActiveJs(js);

    // Local worker streams pass statuses dynamically
    setPipelineStatus(prev => ({ ...prev, 3: 'success', 4: 'success', 5: 'success' }));

    const assistantMessage: Omit<Message, 'id'> = {
      chatId: activeChatId,
      role: 'assistant',
      content: `Created application offline using local model weights. Code generated successfully!`,
      createdAt: Date.now(),
      files: { html, css, js }
    };

    await addMessageToChat(assistantMessage);
    const finalHistory = await getChatMessages(activeChatId);
    setMessages(finalHistory);
    setGenerationActive(false);
    pendingChatIdRef.current = null;
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${themeMode === 'dark' ? 'bg-[#060a13] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

      {/* Top Header bar */}
      <header className={`flex items-center justify-between px-6 py-3 border-b shrink-0 ${themeMode === 'dark' ? 'border-slate-800 bg-[#080d1a]' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#3D5CFF] to-[#6DD3FF] text-white shadow-[0_0_15px_rgba(61,92,255,0.2)]">
            <Cpu size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">ZENTRO</h1>
            <p className="text-xxs text-slate-400 font-medium tracking-wide uppercase">Browser AI Workspace</p>
          </div>
        </div>

        {/* Local model loading bar / switcher */}
        <div className="flex items-center gap-4">
          {/* Mode Switcher */}
          <div className={`flex items-center rounded-lg p-1 border text-xs font-semibold ${themeMode === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            <button
              onClick={() => setEngineMode('server')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${engineMode === 'server'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Server size={12} /> Server Engine
            </button>
            <button
              onClick={() => {
                setEngineMode('local');
                if (localModelStatus === 'idle') {
                  setShowLocalModelOnboarding(true);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${engineMode === 'local'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Cpu size={12} /> Local AI (Offline)
            </button>
          </div>

          {/* Model Selector Dropdown */}
          {engineMode === 'server' ? (
            <select
              id="server-model-select"
              value={serverModel}
              onChange={(e) => setServerModel(e.target.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border focus:outline-none transition-all ${themeMode === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500'
                  : 'bg-white border-slate-200 text-slate-700 focus:border-indigo-500'
                }`}
            >
              <optgroup label="Google Gemini API">
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </optgroup>
              <optgroup label="Groq Cloud API">
                <option value="groq/llama-3.3-70b-versatile">Llama 3.3 70B (Groq)</option>
                <option value="groq/llama-3.1-70b-versatile">Llama 3.1 70B (Groq)</option>
                <option value="groq/llama-3.1-8b-instant">Llama 3.1 8B Instant (Groq)</option>
                <option value="groq/mixtral-8x7b-32768">Mixtral 8x7B (Groq)</option>
                <option value="groq/gemma2-9b-it">Gemma 2 9B (Groq)</option>
                <option value="groq/deepseek-r1-distill-llama-70b">DeepSeek R1 Distill 70B (Groq)</option>
              </optgroup>
              <optgroup label="OpenRouter API (Free)">
                <option value="openrouter/meta-llama/llama-3.1-8b-instruct:free">Llama 3.1 8B Free</option>
                <option value="openrouter/meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B Free</option>
                <option value="openrouter/google/gemma-2-9b-it:free">Gemma 2 9B Free</option>
                <option value="openrouter/mistralai/mistral-7b-instruct:free">Mistral 7B Free</option>
                <option value="openrouter/deepseek/deepseek-r1:free">DeepSeek R1 Free</option>
                <option value="openrouter/deepseek/deepseek-chat-v3-0324:free">DeepSeek V3 Free</option>
                <option value="openrouter/microsoft/phi-4-reasoning:free">Phi-4 Reasoning Free</option>
                <option value="openrouter/qwen/qwen3-8b:free">Qwen3 8B Free</option>
              </optgroup>
            </select>
          ) : (
            <select
              id="local-model-select"
              value={localModel}
              onChange={handleLocalModelChange}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border focus:outline-none transition-all ${themeMode === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-indigo-500'
                  : 'bg-white border-slate-200 text-slate-700 focus:border-indigo-500'
                }`}
            >
              <option value="Xenova/TinyLlama-1.1B-Chat-v1.0">TinyLlama 1.1B Chat ⭐ (~650MB)</option>
              <option value="Xenova/LLaMA-3.2-3B-Instruct">LLaMA 3.2 3B Instruct 🔥 (~2GB)</option>
              <option value="Xenova/LLaMA-3.2-1B-Instruct">LLaMA 3.2 1B Instruct 🆕 (~1GB)</option>
              <option value="Xenova/Qwen1.5-1.8B-Chat">Qwen 1.5 1.8B Chat (~1.1GB)</option>
              <option value="Xenova/Qwen1.5-0.5B-Chat">Qwen 1.5 0.5B Chat (~300MB)</option>
              <option value="Xenova/Phi-3-mini-4k-instruct">Phi-3 Mini 4K 🏆 (~2.3GB)</option>
              <option value="onnx-community/Qwen2.5-Coder-1.5B-Instruct">Qwen2.5 Coder 1.5B 💻 (~1.6GB)</option>
              <option value="onnx-community/Qwen2.5-Coder-3B-Instruct">Qwen2.5 Coder 3B 💎 (~2.4GB)</option>
              <option value="Xenova/bloom-560m">BLOOM 560M 🌍 (~560MB)</option>
              <option value="Xenova/LaMini-GPT-124M">LaMini GPT 124M ⚡ Fastest (~250MB)</option>
            </select>
          )}

          {/* Local Model Loader Status button */}
          {engineMode === 'local' && (
            <button
              onClick={handleInitLocalModel}
              disabled={localModelStatus === 'ready' || localModelStatus === 'loading' || localModelStatus === 'progress'}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-medium transition-all ${localModelStatus === 'ready' ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400' :
                  localModelStatus === 'loading' || localModelStatus === 'progress' ? 'bg-indigo-950/20 border-indigo-800/40 text-indigo-400 cursor-default' :
                    'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
            >
              {(localModelStatus === 'loading' || localModelStatus === 'progress') ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Cpu size={12} />
              )}
              <span>{localModelMsg}</span>
            </button>
          )}

          {/* Toolbox Link */}
          <Link
            href="/toolbox"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-pink-500/40 text-slate-400 hover:text-white rounded-lg text-xs font-semibold transition-all"
            title="Open Offline Developer Utilities"
          >
            <Wrench size={13} className="text-pink-400" />
            Tools
          </Link>

          {/* API Keys Button */}
          <button
            onClick={() => { setApiKeyInput(apiKeys[apiKeyTab] || ''); setShowApiKeyValue(false); setShowApiModal(true); }}
            className="relative flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-white rounded-lg text-xs font-semibold transition-all"
            title="Manage your API keys"
          >
            <KeyRound size={13} />
            API Keys
            {Object.keys(apiKeys).length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 border border-[#070b16] text-[9px] font-black text-white flex items-center justify-center">
                {Object.keys(apiKeys).length}
              </span>
            )}
          </button>

          {/* Export ZIP Button */}
          <button
            onClick={handleDownloadApp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
            title="Download project as a ZIP folder"
          >
            <Download size={13} /> Export ZIP
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={handleToggleTheme}
            className={`p-2 border rounded-lg transition-all ${themeMode === 'dark' ? 'border-slate-800 hover:bg-slate-900/60' : 'border-slate-200 hover:bg-slate-100'}`}
          >
            {themeMode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left column: Sidebar & Chats & 5-Pass indicator */}
        <aside className={`w-[320px] border-r flex flex-col shrink-0 ${themeMode === 'dark' ? 'border-slate-800 bg-[#070b16]' : 'border-slate-200 bg-slate-50'}`}>
          {/* Create new chat session and demo buttons */}
          <div className="p-4 border-b border-slate-800/50 flex flex-col gap-2">
            <button
              onClick={handleCreateNewChat}
              className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
            >
              <FolderPlus size={13} /> New Session
            </button>
          </div>

          {/* Chat history list */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            <h3 className="text-xxs uppercase tracking-wider font-bold text-slate-500 mb-2">Sessions History</h3>
            {chats.length === 0 ? (
              <p className="text-xs text-slate-500 italic px-2">No active sessions.</p>
            ) : (
              chats.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectChat(c.id!)}
                  className={`group flex items-center justify-between p-3 rounded-lg text-xs font-medium cursor-pointer transition-all ${currentChatId === c.id
                      ? 'bg-indigo-950/30 border border-indigo-800/40 text-indigo-300'
                      : 'border border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                    }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <Sparkles size={12} className="shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(c.id!, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-900 hover:text-red-400 rounded transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 5-Pass Visualization Panel */}
          <div className={`p-4 border-t ${themeMode === 'dark' ? 'border-slate-800 bg-[#050810]' : 'border-slate-200 bg-white'}`}>
            <h3 className="text-xxs uppercase tracking-wider font-bold text-slate-500 mb-3 flex items-center gap-1.5">
              <Bot size={11} /> 5-Pass Visual Pipeline
            </h3>

            <div className="flex flex-col gap-2">
              {[
                { num: 1, label: 'Analyze Request' },
                { num: 2, label: 'Create Plan' },
                { num: 3, label: 'Generate Code' },
                { num: 4, label: 'Self Review' },
                { num: 5, label: 'Polish UX' }
              ].map((pass) => (
                <div key={pass.num} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xxs font-bold ${pipelineStatus[pass.num] === 'success' ? 'bg-emerald-950 border border-emerald-500 text-emerald-400' :
                          pipelineStatus[pass.num] === 'running' ? 'bg-indigo-950 border border-indigo-500 text-indigo-400 animate-pulse' :
                            'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                        {pass.num}
                      </span>
                      <span className={`text-xxs font-semibold ${pipelineStatus[pass.num] === 'success' ? 'text-slate-200 font-bold' :
                          pipelineStatus[pass.num] === 'running' ? 'text-indigo-400 font-bold' :
                            'text-slate-500'
                        }`}>
                        {pass.label}
                      </span>
                    </div>
                    {pipelineStatus[pass.num] === 'running' && (
                      <Loader2 size={10} className="text-indigo-400 animate-spin" />
                    )}
                    {pipelineStatus[pass.num] === 'success' && (
                      <CheckCircle2 size={11} className="text-emerald-400" />
                    )}
                  </div>
                  {pipelineStatus[pass.num] === 'running' && pipelineLogs[pass.num] && (
                    <div className="ml-7 p-2 bg-[#090e1b] border border-indigo-900/30 rounded text-xxx flex flex-col font-mono text-slate-400 leading-relaxed max-h-[60px] overflow-y-auto">
                      {pipelineLogs[pass.num]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Panel (Code Editor or AI Tools Tab) & Right Panel (Live Preview) */}
        <main className="flex-1 flex flex-row overflow-hidden p-4 gap-4">

          {/* Center Pane: Chat Log + Code Editor */}
          <div className="flex-1 flex flex-col gap-4 min-w-[350px]">
            {/* Content view */}
            <div className="flex-1 min-h-[300px]">
              <CodeEditor
                html={activeHtml}
                css={activeCss}
                js={activeJs}
                onChange={handleCodeChange}
              />
            </div>

            {/* Bottom Panel: Chat Thread and Input box */}
            <div className={`h-[240px] flex flex-col border rounded-xl overflow-hidden shadow-xl shrink-0 ${themeMode === 'dark' ? 'border-slate-800 bg-[#080c16]' : 'border-slate-200 bg-white'}`}>
              {/* Message log wrapper */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 select-text">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 gap-2 p-4">
                    <Bot size={28} className="text-indigo-400 animate-bounce" />
                    <div>
                      <p className="text-xs font-bold text-slate-400">Describe the web app you want to generate</p>
                      <p className="text-xxs text-slate-500 mt-1 max-w-[280px]">"Create a stylish retro snake game" or "Generate an expense budget manager"</p>
                    </div>
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div key={idx} className={`flex gap-3 text-xs leading-relaxed max-w-[85%] ${m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400 border border-slate-700'
                        }`}>
                        {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                      </div>
                      <div className={`p-3 rounded-lg ${m.role === 'user'
                          ? 'bg-indigo-600 text-white font-medium'
                          : themeMode === 'dark' ? 'bg-slate-900/60 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
                        }`}>
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input row */}
              <div className={`p-3 border-t flex gap-2 shrink-0 ${themeMode === 'dark' ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-slate-50/50'}`}>
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendPrompt();
                  }}
                  disabled={generationActive}
                  placeholder={generationActive ? 'Compiling 5-pass pipeline...' : 'e.g. Build an interactive CRM client system...'}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                <button
                  onClick={handleSendPrompt}
                  disabled={generationActive || !promptInput.trim()}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-all shrink-0"
                >
                  {generationActive ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Live App Preview */}
          <div className="flex-1 min-w-[320px]">
            <PreviewFrame
              html={activeHtml}
              css={activeCss}
              js={activeJs}
              projectName="Live Sandbox App"
            />
          </div>

        </main>
      </div>

      {/* ─── API Keys Settings Modal ─── */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(7,9,20,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-[480px] rounded-2xl border border-white/[0.08] bg-[#0b0c18] shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center">
                  <KeyRound size={15} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-none">API Key Manager</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Your keys are stored only in this browser — never on our servers</p>
                </div>
              </div>
              <button onClick={() => setShowApiModal(false)} className="p-1.5 rounded-md hover:bg-white/[0.05] text-slate-500 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Provider tabs */}
            <div className="flex border-b border-white/[0.06]">
              {(['gemini', 'groq', 'openrouter', 'huggingface'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => { setApiKeyTab(p); setApiKeyInput(apiKeys[p] || ''); setShowApiKeyValue(false); setApiKeySaved(false); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all ${apiKeyTab === p ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${apiKeys[p] ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                  {{ gemini: 'Google Gemini', groq: 'Groq', openrouter: 'OpenRouter', huggingface: 'Hugging Face' }[p]}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-5 flex flex-col gap-4">
              {/* Provider info row */}
              <div className="rounded-xl bg-[#070914] border border-white/[0.04] px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{{ gemini: 'Google Gemini API', groq: 'Groq Cloud API', openrouter: 'OpenRouter API', huggingface: 'Hugging Face Token' }[apiKeyTab]}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{{ gemini: 'Free tier · aistudio.google.com', groq: 'Free tier · console.groq.com', openrouter: 'Free models · openrouter.ai/keys', huggingface: 'Required for gated/private models · huggingface.co/settings/tokens' }[apiKeyTab]}</p>
                </div>
                {apiKeys[apiKeyTab] ? (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">✓ ACTIVE</span>
                ) : apiKeyTab === 'huggingface' && serverHfConfigured ? (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">✓ SERVER DEFAULT</span>
                ) : (
                  <span className="text-[9px] font-bold text-slate-500 bg-white/[0.03] border border-white/[0.06] px-2 py-1 rounded-full">NOT SET</span>
                )}
              </div>

              {/* Key input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Your API Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKeyValue ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      placeholder={{ gemini: 'AIza...', groq: 'gsk_...', openrouter: 'sk-or-...', huggingface: 'hf_...' }[apiKeyTab]}
                      className="w-full px-3 pr-9 py-2.5 rounded-lg bg-[#070914] border border-white/[0.06] text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                    <button onClick={() => setShowApiKeyValue(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
                      {showApiKeyValue ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  <button
                    onClick={saveApiKey}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${apiKeySaved ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                  >
                    {apiKeySaved ? <><Check size={13} className="inline mr-1" />Saved!</> : 'Save'}
                  </button>
                </div>
              </div>

              {apiKeys[apiKeyTab] && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                  <p className="text-[10.5px] text-emerald-400">Custom key active — overrides server default</p>
                  <button onClick={() => removeApiKey(apiKeyTab)} className="text-[10px] font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                    <Trash2 size={10} /> Remove
                  </button>
                </div>
              )}

              {/* API Walkthrough Help Card */}
              <div className="bg-slate-950/60 border border-white/[0.04] p-3 rounded-xl flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-350 uppercase tracking-wider">
                  <HelpCircle size={12} className="text-indigo-400" />
                  <span>How to get your {apiKeyTab === 'gemini' ? 'Google Gemini' : apiKeyTab === 'groq' ? 'Groq Cloud' : 'OpenRouter'} key</span>
                </div>

                {apiKeyTab === 'gemini' && (
                  <div className="flex flex-col gap-1.5 text-[10px] text-slate-400 leading-normal">
                    <div className="flex items-start gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">1</span>
                      <p>Go to <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-0.5">Google AI Studio <ExternalLink size={8} /></a>.</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">2</span>
                      <p>Sign in using your Google or Workspace account.</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">3</span>
                      <p>Click <strong className="text-slate-300">"Create API Key"</strong> in the top-left sidebar.</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">4</span>
                      <p>Copy the key (starts with <code className="font-mono text-indigo-300">AIzaSy</code>) and paste it above.</p>
                    </div>
                  </div>
                )}

                {apiKeyTab === 'groq' && (
                  <div className="flex flex-col gap-1.5 text-[10px] text-slate-400 leading-normal">
                    <div className="flex items-start gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">1</span>
                      <p>Open the <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-0.5">Groq Cloud Console <ExternalLink size={8} /></a>.</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">2</span>
                      <p>Create a free account or log in.</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">3</span>
                      <p>Go to the <strong className="text-slate-300">"API Keys"</strong> tab in the sidebar menu.</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">4</span>
                      <p>Click <strong className="text-slate-300">"Create API Key"</strong>, copy the key (<code className="font-mono text-indigo-300">gsk_</code>), and paste it above.</p>
                    </div>
                  </div>
                )}

                {apiKeyTab === 'openrouter' && (
                  <div className="flex flex-col gap-1.5 text-[10px] text-slate-400 leading-normal">
                    <div className="flex items-start gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">1</span>
                      <p>Visit <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-0.5">OpenRouter.ai Keys <ExternalLink size={8} /></a>.</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">2</span>
                      <p>Log in or sign up via Google or Discord.</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">3</span>
                      <p>Navigate to <strong className="text-slate-300">"Keys"</strong> or click your profile settings.</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">4</span>
                      <p>Create key (starts with <code className="font-mono text-indigo-300">sk-or-</code>). Free models require no credits!</p>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[9.5px] text-slate-600 leading-relaxed">
                🔒 Keys are stored in your browser&apos;s localStorage. They are sent directly to the AI provider and are never logged or stored on our servers.
              </p>
            </div>
          </div>
        </div>
      )}

      <ModelDownloadOverlay
        visible={engineMode === 'local' && !isRestoringModel && (localModelStatus === 'loading' || localModelStatus === 'progress')}
        modelName={localModel.split('/').pop() || localModel}
        progress={downloadProgress}
      />

      {/* ─── Local AI Onboarding / Download Modal ─── */}
      {showLocalModelOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(7,9,20,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-[500px] rounded-2xl border border-white/[0.08] bg-[#0b0c18] shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center">
                  <Cpu size={15} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-none">Initialize Local Offline AI</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Run private generation in-browser via WebAssembly & WebGPU</p>
                </div>
              </div>
              <button onClick={() => setShowLocalModelOnboarding(false)} className="p-1.5 rounded-md hover:bg-white/[0.05] text-slate-500 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-slate-450 leading-relaxed">
                To run code-building completely offline with absolute privacy, Zentro downloads and caches a Large Language Model (LLM) inside your browser's local cache. 
              </p>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Select LLM Size</label>
                <select
                  value={localModel}
                  onChange={handleLocalModelChange}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#070914] border border-white/[0.06] text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                >
                  <option value="Xenova/TinyLlama-1.1B-Chat-v1.0">TinyLlama 1.1B Chat (Best Quality ~650MB)</option>
                  <option value="Xenova/Qwen1.5-0.5B-Chat">Qwen 1.5 0.5B Chat (Balanced ~300MB)</option>
                  <option value="Xenova/LaMini-GPT-124M">LaMini GPT 124M (Fastest ~250MB)</option>
                </select>
              </div>

              <div className="rounded-xl bg-indigo-950/20 border border-indigo-850/30 p-3.5 flex flex-col gap-2 text-xxs text-slate-400">
                <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                  <Sparkles size={11} />
                  <span>How it works:</span>
                </div>
                <ul className="list-disc pl-4 flex flex-col gap-1 text-slate-400">
                  <li>Downloads are cached securely in your browser's IndexedDB.</li>
                  <li>Subsequent generation queries will boot instantly and run 100% offline.</li>
                  <li>Initial load requires a stable internet connection.</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 mt-2">
                <button
                  onClick={() => setShowLocalModelOnboarding(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/[0.06] hover:bg-white/[0.02] text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLocalModelOnboarding(false);
                    handleInitLocalModel();
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-[0_4px_20px_rgba(99,102,241,0.25)]"
                >
                  Download & Initialize
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Credits / Error Popup Banner ─── */}
      {errorPopup.visible && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] rounded-2xl border border-red-500/25 bg-[#0b0c18] shadow-[0_8px_40px_rgba(239,68,68,0.18)] overflow-hidden" style={{ animation: 'slideUp 0.3s ease' }}>
          <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>
          {/* Glowing top edge */}
          <div className="h-0.5 w-full bg-gradient-to-r from-red-500/60 via-amber-400/60 to-red-500/60"></div>

          <div className="p-4 flex flex-col gap-3">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/25 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} className="text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-none">{errorPopup.message}</p>
                  <p className="text-[10px] text-red-400 font-semibold mt-0.5 tracking-wide">
                    {errorPopup.message === 'Model not available'
                      ? 'MODEL UNAVAILABLE'
                      : errorPopup.message === 'WebGPU required for this model'
                        ? 'WEBGPU REQUIRED'
                        : errorPopup.message === 'Model runtime failed (WASM/WebGPU)' ||
                          errorPopup.message === 'Not enough browser memory'
                          ? 'OUT OF MEMORY'
                          : 'API QUOTA / RATE LIMIT'}
                  </p>
                </div>
              </div>
              <button
                onClick={dismissError}
                className="p-1 rounded-md hover:bg-white/[0.04] text-slate-500 hover:text-white transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            {/* Error reason detail */}
            {errorPopup.reason && (
              <div className="rounded-lg bg-[#070914] border border-white/[0.04] px-3 py-2.5 text-[10.5px] text-slate-400 font-mono leading-relaxed" style={{ maxHeight: '72px', overflow: 'hidden' }}>
                {errorPopup.reason.length > 220 ? errorPopup.reason.substring(0, 220) + '...' : errorPopup.reason}
              </div>
            )}

            {/* Action hint */}
            <div className="flex items-center gap-2 pt-0.5">
              <RefreshCcw size={11} className="text-[#3D5CFF] shrink-0" />
              <p className="text-[10px] text-slate-500 leading-snug">
                {errorPopup.message === 'Model not available' ? (
                  <>Choose a different model from the <span className="text-[#6DD3FF] font-semibold">local model dropdown</span> at the top.</>
                ) : errorPopup.message === 'WebGPU required for this model' ? (
                  <>Use Chrome 113+ or Edge 113+, or pick a smaller model from the dropdown.</>
                ) : errorPopup.message === 'Model runtime failed (WASM/WebGPU)' ||
                  errorPopup.message === 'Not enough browser memory' ? (
                  <>Close other tabs, refresh, then pick a smaller model (LaMini 124M, Qwen 0.5B, or TinyLlama 1.1B).</>
                ) : (
                  <>Switch the model from the <span className="text-[#6DD3FF] font-semibold">top dropdown</span> to Groq or OpenRouter and try again.</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
