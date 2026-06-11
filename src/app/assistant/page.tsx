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
import Link from 'next/link';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  Cpu, 
  Server, 
  Trash2, 
  Plus, 
  Brain, 
  UserSquare2, 
  Settings, 
  Zap, 
  ArrowLeft, 
  Copy, 
  Loader2,
  Check,
  Terminal,
  HelpCircle,
  AlertTriangle,
  X,
  RefreshCcw,
  KeyRound,
  Eye,
  EyeOff,
  ExternalLink,
  Download,
  Package,
  ChevronDown,
  Search,
  Layers,
  Gauge,
  MemoryStick,
  Wifi,
  WifiOff,
  Star,
  Zap as ZapIcon,
  ShieldCheck
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

// ─── Model Library ────────────────────────────────────────────────────────────

interface LocalModelInfo {
  id: string;                  // HuggingFace model ID
  name: string;                // Display name
  family: string;              // e.g. "LLaMA", "Qwen", "Phi"
  category: 'tiny' | 'small' | 'medium' | 'large';
  sizeMB: number;              // Approximate download size in MB
  description: string;
  tags: string[];
  recommended?: boolean;
  badge?: string;              // e.g. "Best Quality", "Fastest"
}

const LOCAL_MODEL_LIBRARY: LocalModelInfo[] = [
  // ── Tiny (<300MB) ──────────────────────────────────────────────────────────
  {
    id: 'Xenova/LaMini-GPT-124M',
    name: 'LaMini GPT 124M',
    family: 'GPT-2',
    category: 'tiny',
    sizeMB: 250,
    description: 'Ultra-lightweight GPT-2 variant fine-tuned on instruction tasks. Blazing fast, works on any device.',
    tags: ['Fastest', 'Instruction', 'GPT-2'],
    badge: '⚡ Fastest'
  },
  {
    id: 'Xenova/gpt2',
    name: 'GPT-2 Base',
    family: 'GPT-2',
    category: 'tiny',
    sizeMB: 250,
    description: 'Classic OpenAI GPT-2 base model. Great for creative writing and simple completions.',
    tags: ['Classic', 'Creative', 'Fast'],
  },
  {
    id: 'Xenova/distilgpt2',
    name: 'DistilGPT-2',
    family: 'GPT-2',
    category: 'tiny',
    sizeMB: 170,
    description: 'Distilled version of GPT-2 — 40% smaller and 60% faster with 97% of the quality.',
    tags: ['Distilled', 'Minimal', 'Offline'],
    badge: '🪶 Lightest'
  },
  {
    id: 'Xenova/Qwen1.5-0.5B-Chat',
    name: 'Qwen 1.5 0.5B Chat',
    family: 'Qwen',
    category: 'tiny',
    sizeMB: 300,
    description: 'Alibaba Qwen 0.5B chat model. Surprisingly capable for its tiny size, with proper chat template.',
    tags: ['Qwen', 'Chat', 'Alibaba'],
  },

  // ── Small (300MB–700MB) ───────────────────────────────────────────────────
  {
    id: 'Xenova/TinyLlama-1.1B-Chat-v1.0',
    name: 'TinyLlama 1.1B Chat',
    family: 'LLaMA',
    category: 'small',
    sizeMB: 650,
    description: 'The most popular on-device chat model. Excellent quality-to-size ratio with full chat template support.',
    tags: ['LLaMA', 'Chat', 'Popular'],
    recommended: true,
    badge: '⭐ Recommended'
  },
  {
    id: 'Xenova/Qwen1.5-1.8B-Chat',
    name: 'Qwen 1.5 1.8B Chat',
    family: 'Qwen',
    category: 'small',
    sizeMB: 1100,
    description: 'Alibaba Qwen 1.8B — substantially smarter than 0.5B while still running in-browser.',
    tags: ['Qwen', 'Chat', 'Balanced'],
  },
  {
    id: 'Xenova/opt-350m',
    name: 'OPT 350M',
    family: 'OPT',
    category: 'small',
    sizeMB: 350,
    description: 'Meta\'s Open Pre-trained Transformer 350M. Great balance of speed and reasoning depth.',
    tags: ['Meta', 'OPT', 'Reasoning'],
  },
  {
    id: 'Felladrin/onnx-Llama-160M-Chat-v1',
    name: 'LLaMA 160M Chat',
    family: 'LLaMA',
    category: 'tiny',
    sizeMB: 210,
    description: 'Compact LLaMA chat model with full instruction following. Ideal for low-RAM devices.',
    tags: ['LLaMA', 'Chat', 'Compact'],
  },
  {
    id: 'Xenova/bloom-560m',
    name: 'BLOOM 560M',
    family: 'BLOOM',
    category: 'small',
    sizeMB: 560,
    description: 'BigScience BLOOM 560M — multilingual model supporting 46 languages and 13 programming languages.',
    tags: ['Multilingual', 'BigScience', 'Multilanguage'],
    badge: '🌍 Multilingual'
  },
  {
    id: 'Xenova/pythia-410m',
    name: 'Pythia 410M',
    family: 'Pythia',
    category: 'small',
    sizeMB: 410,
    description: 'EleutherAI Pythia 410M — great for code understanding and technical Q&A.',
    tags: ['EleutherAI', 'Code', 'Technical'],
  },

  // ── Medium (700MB–2GB) ────────────────────────────────────────────────────
  {
    id: 'Xenova/Phi-3-mini-4k-instruct',
    name: 'Phi-3 Mini 4K',
    family: 'Phi',
    category: 'medium',
    sizeMB: 2300,
    description: 'Microsoft Phi-3 Mini — state-of-the-art small model. Exceptionally capable for coding and analysis.',
    tags: ['Microsoft', 'Phi-3', 'SOTA'],
    badge: '🏆 Top Quality'
  },
  {
    id: 'onnx-community/Qwen2.5-1.5B-Instruct',
    name: 'Qwen 2.5 1.5B Instruct',
    family: 'Qwen',
    category: 'medium',
    sizeMB: 1165,
    description: 'Alibaba Qwen 2.5 1.5B — strong general chat model. Uses q4f16 WebGPU weights (~1.2 GB).',
    tags: ['Qwen', 'Chat', 'WebGPU'],
    badge: '🎮 WebGPU'
  },
  {
    id: 'Xenova/falcon-rw-1b',
    name: 'Falcon RW 1B',
    family: 'Falcon',
    category: 'medium',
    sizeMB: 1000,
    description: 'TII UAE Falcon 1B refined web model. Known for strong text generation quality.',
    tags: ['TII', 'Falcon', 'Text Gen'],
  },
  {
    id: 'Xenova/flan-t5-base',
    name: 'Flan-T5 Base',
    family: 'T5',
    category: 'small',
    sizeMB: 450,
    description: 'Google Flan-T5 Base — instruction-tuned text-to-text model. Excellent at summarization and Q&A.',
    tags: ['Google', 'T5', 'Summarization'],
    badge: '📝 Summarizer'
  },
  // ── Large (2GB+) ──────────────────────────────────────────────────────────
  {
    id: 'Xenova/LLaMA-3.2-3B-Instruct',
    name: 'LLaMA 3.2 3B Instruct',
    family: 'LLaMA',
    category: 'large',
    sizeMB: 2000,
    description: 'Meta LLaMA 3.2 3B — strongest available open model in this size. Best for complex tasks. Requires 6GB+ RAM.',
    tags: ['Meta', 'LLaMA 3', 'SOTA'],
    badge: '💎 Premium'
  },
  {
    id: 'Xenova/LLaMA-3.2-1B-Instruct',
    name: 'LLaMA 3.2 1B Instruct',
    family: 'LLaMA',
    category: 'small',
    sizeMB: 1000,
    description: 'Meta LLaMA 3.2 1B — latest generation LLaMA. Dramatically improved reasoning and instruction following.',
    tags: ['Meta', 'LLaMA 3', 'Instruct'],
    badge: '🆕 Latest LLaMA'
  },
  // ── New additions ────────────────────────────────────────────────────────
  {
    id: 'onnx-community/Qwen2.5-Coder-0.5B-Instruct',
    name: 'Qwen2.5 Coder 0.5B',
    family: 'Qwen',
    category: 'tiny',
    sizeMB: 945,
    description: 'Alibaba Qwen2.5 Coder 0.5B — specialized for code generation tasks with tiny VRAM footprint.',
    tags: ['Qwen', 'Code', 'Instruct'],
    badge: '💻 Coder'
  },
  {
    id: 'onnx-community/Qwen2.5-Coder-1.5B-Instruct',
    name: 'Qwen2.5 Coder 1.5B',
    family: 'Qwen',
    category: 'small',
    sizeMB: 1165,
    description: 'Alibaba Qwen2.5 Coder 1.5B — strong coding assistant. Uses q4f16 WebGPU weights (~1.2 GB).',
    tags: ['Qwen', 'Code', 'WebGPU'],
    badge: '💻 Best Coder Small'
  },
  {
    id: 'onnx-community/Qwen2.5-Coder-3B-Instruct',
    name: 'Qwen2.5 Coder 3B',
    family: 'Qwen',
    category: 'medium',
    sizeMB: 2400,
    description: 'Alibaba Qwen2.5 Coder 3B — powerful code model with deep reasoning and multi-language support.',
    tags: ['Qwen', 'Code', 'Multi-language'],
    badge: '💎 Top Code Model'
  },
  {
    id: 'microsoft/Phi-3.5-mini-instruct',
    name: 'Phi-3.5 Mini Instruct',
    family: 'Phi',
    category: 'medium',
    sizeMB: 3600,
    description: 'Microsoft Phi-3.5 Mini 3.8B — latest Phi model with improved multilingual support and reasoning.',
    tags: ['Microsoft', 'Phi-3.5', 'Instruct'],
    badge: '🆕 Latest Phi'
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  tiny: '⚡ Tiny (<300MB)',
  small: '🚀 Small (300–700MB)',
  medium: '🧠 Medium (700MB–2.5GB)',
  large: '💎 Large (2.5GB+)',
};

const FAMILY_COLORS: Record<string, string> = {
  'LLaMA':    '#3D5CFF',
  'Qwen':     '#7C3AED',
  'Phi':      '#0891B2',
  'Gemma':    '#D97706',
  'GPT-2':    '#16A34A',
  'T5':       '#DB2777',
  'BLOOM':    '#4F46E5',
  'Pythia':   '#9333EA',
  'Falcon':   '#EA580C',
  'StableLM': '#0284C7',
  'OPT':      '#059669',
  'SmolLM':   '#F59E0B',
  'DeepSeek': '#06B6D4',
  'Mistral':  '#8B5CF6',
};

// ─── Persona Types ────────────────────────────────────────────────────────────

interface Persona {
  id: string;
  name: string;
  systemPrompt: string;
  isCustom?: boolean;
}

const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'vibe',
    name: 'Vibe',
    systemPrompt: 'You are a chill, highly skilled AI assistant. You speak with some tech slang, emoji, and absolute confidence. When the user sends a casual message or greeting (like "hi", "hello", "hey", "how are you"), respond naturally and conversationally — do NOT generate code or technical output. Only write code when the user explicitly asks for code, programming help, or a technical task. Keep responses concise unless depth is requested.'
  },
  {
    id: 'plain',
    name: 'Plain',
    systemPrompt: 'Answer queries as briefly, directly, and plainly as possible. For casual messages or greetings, reply in one short sentence. Omit headers, conversational filler, and detailed explanations unless explicitly asked. Only generate code when the user explicitly requests it.'
  },
  {
    id: 'mentor',
    name: 'Mentor',
    systemPrompt: 'You are a patient senior software engineer mentor. For casual messages and greetings, respond warmly and naturally in plain conversational text — do not generate code or technical output unless the user asks a technical question. When helping with code, provide thorough explanations, highlight potential bugs, write comments explaining every line, and guide the user through logical steps.'
  }
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AssistantPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [promptInput, setPromptInput] = useState('');
  
  // Model & Engine Configuration
  const [engineMode, setEngineMode] = useState<'server' | 'local'>('local');
  const [serverModel, setServerModel] = useState('gemini-2.5-flash');
  const [localModelId, setLocalModelId] = useState('Xenova/TinyLlama-1.1B-Chat-v1.0');
  const [generationActive, setGenerationActive] = useState(false);

  // Local model state tracking
  const [localModelStatus, setLocalModelStatus] = useState<'idle' | 'loading' | 'progress' | 'ready' | 'error'>('idle');
  const [localModelMsg, setLocalModelMsg] = useState('No model loaded — click "Choose Model" to select one');
  const [localModelPercent, setLocalModelPercent] = useState(0);
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<ModelDownloadProgressState>(INITIAL_MODEL_DOWNLOAD_PROGRESS);
  const [isRestoringModel, setIsRestoringModel] = useState(false);

  // Memories & Personas States
  const [memories, setMemories] = useState<string[]>([]);
  const [newMemoryInput, setNewMemoryInput] = useState('');
  const [personas, setPersonas] = useState<Persona[]>(DEFAULT_PERSONAS);
  const [activePersonaId, setActivePersonaId] = useState('vibe');
  const [showCustomPersonaModal, setShowCustomPersonaModal] = useState(false);
  const [customPersonaName, setCustomPersonaName] = useState('');
  const [customPersonaPrompt, setCustomPersonaPrompt] = useState('');

  // UI States
  const [powerMode, setPowerMode] = useState(false);
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [errorPopup, setErrorPopup] = useState<{ visible: boolean; message: string; reason?: string }>({ visible: false, message: '' });
  const errorDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // API Key Settings Modal
  const [showApiModal, setShowApiModal] = useState(false);
  const [apiKeyTab, setApiKeyTab] = useState<'gemini' | 'groq' | 'openrouter' | 'huggingface'>('gemini');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyValue, setShowApiKeyValue] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [serverHfConfigured, setServerHfConfigured] = useState(false);

  // Model Library Modal
  const [showModelLibrary, setShowModelLibrary] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [modelCategoryFilter, setModelCategoryFilter] = useState<string>('all');
  const [modelFamilyFilter, setModelFamilyFilter] = useState<string>('all');

  const workerRef = useRef<Worker | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingChatIdRef = useRef<string | null>(null);

  // Load configuration and initialize worker
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

    const savedMemories = localStorage.getItem('zentro-memories');
    if (savedMemories) setMemories(JSON.parse(savedMemories));

    const savedPersonas = localStorage.getItem('zentro-custom-personas');
    if (savedPersonas) setPersonas([...DEFAULT_PERSONAS, ...JSON.parse(savedPersonas)]);

    const savedActivePersona = localStorage.getItem('zentro-active-persona');
    if (savedActivePersona) setActivePersonaId(savedActivePersona);

    const { modelId: savedLocalModel, wasReady: savedModelReady } = getSavedLocalModelState();
    if (savedLocalModel) {
      setLocalModelId(savedLocalModel);
      if (savedModelReady) {
        setLoadedModelId(savedLocalModel);
        setLocalModelStatus('loading');
        setLocalModelMsg('Restoring cached model...');
        setIsRestoringModel(true);
      }
    }

    // Spawn Web Worker for local AI
    workerRef.current = new Worker('/ai-worker.js', { type: 'module' });
    
    workerRef.current.onmessage = (event) => {
      const { status, message, progress, token, error, result, errorType, model: readyModel } = event.data;

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
        setLocalModelMsg('Local AI Active — ready offline');
        setDownloadProgress(INITIAL_MODEL_DOWNLOAD_PROGRESS);
        setIsRestoringModel(false);
        const activeModel = readyModel || localStorage.getItem(LOCAL_MODEL_STORAGE_KEY);
        if (activeModel) {
          markLocalModelReady(activeModel);
          setLoadedModelId(activeModel);
          setLocalModelId(activeModel);
        }
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
        setErrorPopup({ visible: true, message: info.message, reason: info.reason });
        if (errorDismissRef.current) clearTimeout(errorDismissRef.current);
        errorDismissRef.current = setTimeout(() => {
          setErrorPopup({ visible: false, message: '' });
        }, 10000);
        if (info.suggestModelLibrary) {
          setShowModelLibrary(true);
        }
      }
    };

    workerRef.current.onerror = (err) => {
      console.error('[AI Worker Error]', err);
      setLocalModelStatus('error');
      setLocalModelMsg('Worker failed to load: ' + (err.message || 'Check console for details'));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowShortcutModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (savedLocalModel && savedModelReady) {
      const modelInfo = LOCAL_MODEL_LIBRARY.find((m) => m.id === savedLocalModel);
      workerRef.current.postMessage({
        type: 'load',
        data: {
          model: savedLocalModel,
          expectedSizeMB: modelInfo?.sizeMB ?? Math.round(getModelExpectedBytes(savedLocalModel) / (1024 * 1024)),
          restore: true,
          useHfProxy: true,
          token: getStoredHfToken(),
          origin: window.location.origin,
        },
      });
    }

    return () => {
      workerRef.current?.terminate();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Chat Management ───────────────────────────────────────────────────────

  const loadChatSessions = async (selectFirst = false) => {
    const list = await getAllChats();
    const assistantChats = list.filter(c => c.type === 'assistant');
    setChats(assistantChats);
    if (selectFirst && assistantChats.length > 0) {
      handleSelectChat(assistantChats[0].id!);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    const history = await getChatMessages(chatId);
    setMessages(history);
  };

  const handleCreateNewChat = async () => {
    const title = `Chat Session ${chats.length + 1}`;
    const id = await createNewChat(title, 'assistant');
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

  // ─── Memories ─────────────────────────────────────────────────────────────

  const handleAddMemory = () => {
    if (!newMemoryInput.trim()) return;
    const updated = [...memories, newMemoryInput.trim()];
    setMemories(updated);
    setNewMemoryInput('');
    localStorage.setItem('zentro-memories', JSON.stringify(updated));
  };

  const handleDeleteMemory = (index: number) => {
    const updated = memories.filter((_, i) => i !== index);
    setMemories(updated);
    localStorage.setItem('zentro-memories', JSON.stringify(updated));
  };

  // ─── Personas ─────────────────────────────────────────────────────────────

  const handleSelectPersona = (id: string) => {
    setActivePersonaId(id);
    localStorage.setItem('zentro-active-persona', id);
  };

  const handleCreateCustomPersona = () => {
    if (!customPersonaName.trim() || !customPersonaPrompt.trim()) return;
    const newPersona: Persona = {
      id: `custom-${Date.now()}`,
      name: customPersonaName.trim(),
      systemPrompt: customPersonaPrompt.trim(),
      isCustom: true
    };
    const savedCustom = personas.filter(p => p.isCustom) || [];
    const updatedCustom = [...savedCustom, newPersona];
    setPersonas([...DEFAULT_PERSONAS, ...updatedCustom]);
    localStorage.setItem('zentro-custom-personas', JSON.stringify(updatedCustom));
    setActivePersonaId(newPersona.id);
    localStorage.setItem('zentro-active-persona', newPersona.id);
    setCustomPersonaName('');
    setCustomPersonaPrompt('');
    setShowCustomPersonaModal(false);
  };

  const handleDeletePersona = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const savedCustom = personas.filter(p => p.isCustom && p.id !== id);
    setPersonas([...DEFAULT_PERSONAS, ...savedCustom]);
    localStorage.setItem('zentro-custom-personas', JSON.stringify(savedCustom));
    if (activePersonaId === id) handleSelectPersona('vibe');
  };

  // ─── Local Model ──────────────────────────────────────────────────────────

  const handleLoadModel = (modelId: string) => {
    if (localModelStatus === 'loading' || localModelStatus === 'progress') return;
    clearLocalModelReady();
    setLocalModelId(modelId);
    setLoadedModelId(modelId);
    localStorage.setItem(LOCAL_MODEL_STORAGE_KEY, modelId);
    setShowModelLibrary(false);
    setLocalModelStatus('loading');
    setLocalModelMsg('Preparing model download...');
    setLocalModelPercent(0);
    const modelInfo = LOCAL_MODEL_LIBRARY.find((m) => m.id === modelId);
    setDownloadProgress({
      ...INITIAL_MODEL_DOWNLOAD_PROGRESS,
      total: getModelExpectedBytes(modelId),
    });
    setEngineMode('local');
    const userHfToken = apiKeys['huggingface'] || '';
    workerRef.current?.postMessage({
      type: 'load',
      data: {
        model: modelId,
        expectedSizeMB: modelInfo?.sizeMB ?? 0,
        useHfProxy: true,
        token: userHfToken,
        origin: window.location.origin,
      },
    });
  };

  const handleInitCurrentModel = () => {
    if (localModelStatus === 'ready' || localModelStatus === 'loading' || localModelStatus === 'progress') return;
    clearLocalModelReady();
    if (!localModelId) {
      setShowModelLibrary(true);
      return;
    }
    setLocalModelStatus('loading');
    setLocalModelMsg('Preparing model...');
    setLocalModelPercent(0);
    setDownloadProgress({
      ...INITIAL_MODEL_DOWNLOAD_PROGRESS,
      total: getModelExpectedBytes(localModelId),
    });
    const userHfToken = apiKeys['huggingface'] || '';
    const modelInfo = LOCAL_MODEL_LIBRARY.find((m) => m.id === localModelId);
    workerRef.current?.postMessage({
      type: 'load',
      data: {
        model: localModelId,
        expectedSizeMB: modelInfo?.sizeMB ?? 0,
        useHfProxy: true,
        token: userHfToken,
        origin: window.location.origin,
      },
    });
  };

  // ─── API Keys ─────────────────────────────────────────────────────────────

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

  // ─── Error Display ────────────────────────────────────────────────────────

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

  // ─── System Prompt ────────────────────────────────────────────────────────

  const compileSystemPrompt = () => {
    const activePersona = personas.find(p => p.id === activePersonaId);
    let system = activePersona ? activePersona.systemPrompt : DEFAULT_PERSONAS[0].systemPrompt;
    if (memories.length > 0) {
      system += `\n\nTake into account these personal memory guidelines from the user:\n` + 
        memories.map(m => `- ${m}`).join('\n');
    }
    return system;
  };

  // ─── Send Prompt ──────────────────────────────────────────────────────────

  const handleSendPromptText = async (text: string) => {
    if (!text.trim() || generationActive) return;

    let chatId = currentChatId;
    if (!chatId) {
      const summaryTitle = text.length > 25 ? text.substring(0, 22) + '...' : text;
      chatId = await createNewChat(summaryTitle, 'assistant');
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

    const systemPrompt = compileSystemPrompt();

    if (engineMode === 'local') {
      if (localModelStatus !== 'ready') {
        showError('Local model not ready', 'Please select and load a model from the Model Library first.');
        setGenerationActive(false);
        return;
      }
      pendingChatIdRef.current = chatId;
      const formattedHistory = updatedHistory.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content
      }));
      workerRef.current?.postMessage({
        type: 'chat',
        data: { prompt: text, history: formattedHistory, systemPrompt }
      });
    } else {
      try {
        const formattedHistory = updatedHistory.map(m => ({
          role: m.role,
          content: m.content
        }));
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: formattedHistory,
            model: serverModel,
            systemPrompt,
            userKeys: resolveUserKeys()
          })
        });

        if (!response.ok) {
          let errMsg = response.statusText;
          try {
            const errData = await response.json();
            errMsg = errData.error || errMsg;
          } catch (_) {}
          setPromptInput(text);
          showError('API request failed', errMsg);
          setGenerationActive(false);
          return;
        }

        const data = await response.json();
        if (data.error) {
          setPromptInput(text);
          showError('API error', data.error);
          setGenerationActive(false);
          return;
        }

        const assistantMessage: Omit<Message, 'id'> = {
          chatId: chatId!,
          role: 'assistant',
          content: data.text || 'Sorry, I encountered an empty response.',
          createdAt: Date.now()
        };
        await addMessageToChat(assistantMessage);
        const finalHistory = await getChatMessages(chatId!);
        setMessages(finalHistory);
        setGenerationActive(false);
      } catch (err: any) {
        console.error('API chat request error: ', err);
        setPromptInput(text);
        showError('Network error', err?.message || 'Network or provider error. Please try a different model.');
        setGenerationActive(false);
      }
    }
  };

  const handleSendPrompt = async () => {
    await handleSendPromptText(promptInput);
  };

  const handleLocalModelCompletion = async (result: string, chatId: string | null) => {
    const activeChatId = chatId;
    if (!activeChatId) {
      console.error('handleLocalModelCompletion: no chatId available');
      setGenerationActive(false);
      return;
    }
    const assistantMessage: Omit<Message, 'id'> = {
      chatId: activeChatId,
      role: 'assistant',
      content: result || 'Local inference returned an empty content.',
      createdAt: Date.now()
    };
    await addMessageToChat(assistantMessage);
    const finalHistory = await getChatMessages(activeChatId);
    setMessages(finalHistory);
    setGenerationActive(false);
    pendingChatIdRef.current = null;
  };

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSuggestionClick = (suffix: string) => {
    if (messages.length === 0) return;
    const lastMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastMsg) {
      handleSendPromptText(`Regarding your previous prompt: "${lastMsg.content}". Can you please make the response ${suffix}?`);
    }
  };

  // ─── Model Library Filtering ──────────────────────────────────────────────

  const allFamilies = Array.from(new Set(LOCAL_MODEL_LIBRARY.map(m => m.family))).sort();

  const filteredModels = LOCAL_MODEL_LIBRARY.filter(m => {
    const matchesSearch = !modelSearchQuery || 
      m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
      m.family.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(modelSearchQuery.toLowerCase()));
    const matchesCategory = modelCategoryFilter === 'all' || m.category === modelCategoryFilter;
    const matchesFamily = modelFamilyFilter === 'all' || m.family === modelFamilyFilter;
    return matchesSearch && matchesCategory && matchesFamily;
  });

  const selectedModelInfo = LOCAL_MODEL_LIBRARY.find(m => m.id === localModelId);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col h-screen overflow-hidden bg-[#070914] text-slate-200 relative ${powerMode ? 'border-2 border-[#3D5CFF]/30 shadow-[0_0_30px_rgba(61,92,255,0.1)]' : ''}`}>
      
      {powerMode && (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(61,92,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(61,92,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10 animate-pulse"></div>
      )}

      {/* ── Top Header Bar ── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/[0.04] bg-[#0b0c18]/90 backdrop-blur-md sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1.5 hover:bg-white/[0.04] rounded-lg transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#3D5CFF] to-[#6DD3FF] text-white shadow-[0_0_15px_rgba(61,92,255,0.2)]">
            <Cpu size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5 leading-none">
              Zentro <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3D5CFF]/15 border border-[#3D5CFF]/30 text-[#6DD3FF]">Assistant</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase mt-1">ON-DEVICE CHAT CO-PILOT</p>
          </div>
        </div>

        {/* ── Config Controls ── */}
        <div className="flex items-center gap-3">
          
          {/* Mode Switcher */}
          <div className="flex items-center rounded-lg p-1 border border-white/[0.06] bg-[#070914] text-xs font-semibold">
            <button
              onClick={() => setEngineMode('server')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                engineMode === 'server' 
                  ? 'bg-[#3D5CFF] text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server size={12} /> Server
            </button>
            <button
              onClick={() => setEngineMode('local')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                engineMode === 'local' 
                  ? 'bg-[#3D5CFF] text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <WifiOff size={12} /> Local AI
            </button>
          </div>

          {/* Server model selector */}
          {engineMode === 'server' ? (
            <select
              value={serverModel}
              onChange={(e) => setServerModel(e.target.value)}
              className="px-3 py-1.5 bg-[#070914] border border-white/[0.06] rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-[#3D5CFF] transition-all"
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
            /* Local model: show current model + choose button */
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowModelLibrary(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#0b0c18] border border-white/[0.06] hover:border-[#3D5CFF]/40 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-all"
              >
                <Package size={12} className="text-[#6DD3FF]" />
                {selectedModelInfo ? (
                  <span className="max-w-[140px] truncate">{selectedModelInfo.name}</span>
                ) : (
                  <span className="text-slate-500">Choose Model</span>
                )}
                <ChevronDown size={10} className="text-slate-500" />
              </button>

              {/* Load / Status button */}
              <button
                onClick={handleInitCurrentModel}
                disabled={localModelStatus === 'ready' || localModelStatus === 'loading' || localModelStatus === 'progress'}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all ${
                  localModelStatus === 'ready' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' :
                  localModelStatus === 'loading' || localModelStatus === 'progress' ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-400 cursor-default' :
                  'bg-[#070914] border-white/[0.06] text-slate-400 hover:text-slate-200'
                }`}
              >
                {(localModelStatus === 'loading' || localModelStatus === 'progress') ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : localModelStatus === 'ready' ? (
                  <ShieldCheck size={12} />
                ) : (
                  <Download size={12} />
                )}
                <span className="max-w-[180px] truncate">
                  {localModelStatus === 'progress' 
                    ? `${localModelPercent}%`
                    : localModelStatus === 'ready' 
                    ? 'Online · Offline Ready'
                    : localModelStatus === 'loading'
                    ? 'Loading...'
                    : localModelStatus === 'error'
                    ? 'Error — Retry'
                    : 'Load Model'}
                </span>
              </button>
            </div>
          )}

          {/* API Keys Button */}
          <button
            onClick={() => { setApiKeyInput(apiKeys[apiKeyTab] || ''); setShowApiKeyValue(false); setShowApiModal(true); }}
            className="relative flex items-center gap-1.5 px-3 py-1.5 bg-[#0b0c18] border border-white/[0.06] hover:border-[#3D5CFF]/30 text-slate-400 hover:text-white rounded-lg text-xs font-semibold transition-all"
            title="Manage your API keys"
          >
            <KeyRound size={13} />
            API Keys
            {Object.keys(apiKeys).length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 border border-[#070914] text-[9px] font-black text-white flex items-center justify-center">
                {Object.keys(apiKeys).length}
              </span>
            )}
          </button>

          <Link
            href="/workspace"
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0b0c18] border border-white/[0.06] hover:border-[#3D5CFF]/30 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all"
          >
            Builder <Sparkles size={11} className="text-[#6DD3FF]" />
          </Link>
        </div>
      </header>

      {/* ── Main Split Grid ── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar */}
        <aside className="w-[240px] border-r border-white/[0.04] bg-[#0b0c18]/40 shrink-0 flex flex-col justify-between">
          <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
            
            <button
              onClick={handleCreateNewChat}
              className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-[#3D5CFF] to-[#6DD3FF] hover:brightness-110 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-98"
            >
              <Plus size={14} /> New Chat Thread
            </button>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Conversations</span>
              {chats.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic px-1 mt-1">No saved chats.</p>
              ) : (
                chats.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectChat(c.id!)}
                    className={`group flex items-center justify-between p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                      currentChatId === c.id 
                        ? 'bg-[#3D5CFF]/10 border-[#3D5CFF]/30 text-white font-semibold' 
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate pr-2">{c.title}</span>
                    <button
                      onClick={(e) => handleDeleteSession(c.id!, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/[0.06] hover:text-red-400 rounded transition-opacity"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>

          <div className="p-4 border-t border-white/[0.04] bg-[#070914]/80 flex flex-col gap-2">
            <button 
              onClick={() => setShowShortcutModal(true)}
              className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-slate-300 font-semibold transition-colors"
            >
              <HelpCircle size={12} /> Keyboard Shortcuts
            </button>
            <div className="text-[9px] text-slate-600 leading-tight">
              All conversations run 100% on-device or via direct secure provider routing.
            </div>
          </div>
        </aside>

        {/* Center: Main Chat View */}
        <main className="flex-1 flex flex-col justify-between bg-[#070914] relative">
          
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/[0.04] bg-[#0b0c18]/20 shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Configure Vibe:</span>
              <button
                onClick={() => setPowerMode(!powerMode)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold border transition-all ${
                  powerMode 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                    : 'bg-[#070914] border-white/[0.06] text-slate-400 hover:text-slate-300'
                }`}
              >
                <Zap size={10} className={powerMode ? 'animate-bounce' : ''} />
                <span>Power Mode</span>
              </button>
            </div>

            <div className="text-[10px] text-slate-500 font-mono">
              Persona: <span className="text-[#6DD3FF] font-semibold">{personas.find(p => p.id === activePersonaId)?.name}</span>
              {engineMode === 'local' && localModelStatus === 'ready' && selectedModelInfo && (
                <> · <span className="text-emerald-400">{selectedModelInfo.name}</span></>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3D5CFF] to-[#6DD3FF] flex items-center justify-center text-white mb-5 shadow-[0_0_30px_rgba(61,92,255,0.25)]">
                  <Bot size={28} />
                </div>
                <h3 className="text-lg font-extrabold text-white mb-2">Zentro general-purpose assistant</h3>
                <p className="text-slate-400 text-xs max-w-sm leading-relaxed mb-6">
                  {engineMode === 'local' && localModelStatus !== 'ready' 
                    ? 'Select a local model from the library and load it to chat offline.'
                    : 'Select a persona and memory rule, then write prompts. Runs offline cached models or direct cloud APIs.'
                  }
                </p>
                {engineMode === 'local' && localModelStatus !== 'ready' && (
                  <button
                    onClick={() => setShowModelLibrary(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#3D5CFF] to-[#6DD3FF] text-white rounded-xl text-xs font-bold shadow-lg hover:brightness-110 transition-all mb-6"
                  >
                    <Package size={14} /> Open Model Library
                  </button>
                )}
                <div className="flex flex-wrap gap-2.5 justify-center max-w-md">
                  {[
                    "Explain JavaScript closures with code",
                    "Write a CSS grid card grid snippet",
                    "Optimize this database query structure",
                    "Compare on-device WebGPU vs cloud LLMs"
                  ].map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendPromptText(s)}
                      className="px-3.5 py-2 rounded-lg bg-[#0b0c18] border border-white/[0.04] hover:border-[#3D5CFF]/30 text-[11px] text-slate-300 hover:text-white transition-all text-left"
                    >
                      {s} &rarr;
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(m => (
                <div 
                  key={m.id}
                  className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-[#3D5CFF]/15 border border-[#3D5CFF]/30 text-[#6DD3FF] flex items-center justify-center shrink-0 shadow-inner font-bold text-xs">
                      AI
                    </div>
                  )}

                  <div className={`max-w-[75%] rounded-xl p-4 border text-xs leading-relaxed relative group transition-all ${
                    m.role === 'user'
                      ? 'bg-[#3D5CFF]/10 border-[#3D5CFF]/30 text-slate-200 rounded-tr-none'
                      : 'bg-[#0b0c18]/80 border-white/[0.04] text-slate-300 rounded-tl-none shadow-[0_4px_20px_rgba(0,0,0,0.15)]'
                  }`}>
                    
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => handleCopyMessage(m.id!, m.content)}
                        className="p-1 rounded bg-[#070914] border border-white/[0.04] hover:border-[#3D5CFF]/30 text-slate-400 hover:text-white transition-colors"
                        title="Copy message content"
                      >
                        {copiedMessageId === m.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      </button>
                    </div>

                    <div className="whitespace-pre-wrap font-sans">
                      {m.content.includes('```') ? (
                        m.content.split('```').map((part, index) => {
                          if (index % 2 === 1) {
                            const lines = part.split('\n');
                            const lang = lines.shift() || 'code';
                            return (
                              <div key={index} className="my-3 rounded-lg border border-white/[0.04] bg-[#070914] overflow-hidden">
                                <div className="px-3.5 py-1.5 bg-[#0b0c18]/60 border-b border-white/[0.04] text-[10px] text-slate-500 font-mono flex items-center justify-between">
                                  <span>{lang}</span>
                                  <span className="text-[9px] uppercase tracking-wider text-slate-600">output file</span>
                                </div>
                                <pre className="p-3.5 overflow-x-auto text-[11px] font-mono text-[#6DD3FF] leading-relaxed">
                                  {lines.join('\n')}
                                </pre>
                              </div>
                            );
                          }
                          return <span key={index}>{part}</span>;
                        })
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>

                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(79,70,229,0.3)] font-bold text-xs uppercase">
                      U
                    </div>
                  )}
                </div>
              ))
            )}

            {generationActive && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-lg bg-[#3D5CFF]/15 border border-[#3D5CFF]/30 text-[#6DD3FF] flex items-center justify-center shrink-0 animate-pulse font-bold text-xs">
                  AI
                </div>
                <div className="bg-[#0b0c18]/40 border border-white/[0.02] text-slate-500 rounded-xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2 animate-pulse">
                  <Loader2 size={12} className="animate-spin text-[#6DD3FF]" />
                  <span>Assistant is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suffix bar */}
          {messages.length > 0 && !generationActive && (
            <div className="flex gap-2 px-6 pb-2 shrink-0 overflow-x-auto">
              <span className="text-[10px] text-slate-500 font-bold shrink-0 self-center uppercase tracking-wider mr-1">Modify:</span>
              {[
                { label: "Shorter", value: "shorter and more brief" },
                { label: "Deeper", value: "more detailed, explaining the logic step-by-step" },
                { label: "Add comments", value: "fully documented with detailed code comments" },
                { label: "Performance", value: "reviewed for performance efficiency and complexity" }
              ].map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(s.value)}
                  className="px-2.5 py-1 bg-[#0b0c18]/50 border border-white/[0.04] hover:border-[#3D5CFF]/30 text-[9px] font-bold text-slate-400 hover:text-white rounded-md transition-colors shrink-0"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Bottom input */}
          <div className="p-4 border-t border-white/[0.04] bg-[#0b0c18]/40 shrink-0">
            <div className="relative rounded-xl border border-white/[0.06] bg-[#070914] focus-within:border-[#3D5CFF]/50 transition-colors p-2 flex flex-col gap-2">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                placeholder="Ask assistant anything..."
                rows={2}
                className="w-full bg-transparent border-none outline-none resize-none text-xs text-slate-200 placeholder-slate-500 px-2 py-1 leading-relaxed focus:ring-0"
              />
              <div className="flex items-center justify-between border-t border-white/[0.02] pt-2 px-2 shrink-0">
                <span className="text-[9px] text-slate-600">
                  Press Enter to send · Shift+Enter for new line
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setPromptInput(prev => prev + text);
                      } catch (err) {
                        showError('Clipboard permission denied', 'Allow clipboard access in your browser settings.');
                      }
                    }}
                    className="p-1 text-[10px] text-slate-500 hover:text-slate-300 font-semibold transition-colors bg-[#0b0c18] border border-white/[0.04] rounded-md px-2"
                  >
                    Paste
                  </button>
                  <button
                    onClick={handleSendPrompt}
                    disabled={!promptInput.trim() || generationActive}
                    className="flex items-center justify-center p-2 rounded-lg bg-gradient-to-r from-[#3D5CFF] to-[#6DD3FF] text-white hover:brightness-110 shadow-md transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ── Right Sidebar: Memories & Personas ── */}
        <aside className="w-[280px] border-l border-white/[0.04] bg-[#0b0c18]/45 shrink-0 flex flex-col divide-y divide-white/[0.04] overflow-y-auto">
          
          {/* Personas */}
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <UserSquare2 size={13} className="text-[#6DD3FF]" />
                System Personas
              </span>
              <button
                onClick={() => setShowCustomPersonaModal(true)}
                className="text-[10px] text-[#3D5CFF] hover:text-[#6DD3FF] font-bold transition-colors"
              >
                + Custom
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {personas.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPersona(p.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    activePersonaId === p.id 
                      ? 'bg-[#3D5CFF]/15 border-[#3D5CFF]/40 text-white shadow-inner' 
                      : 'bg-transparent border-white/[0.04] hover:border-white/[0.1] text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{p.name}</span>
                    {p.isCustom && (
                      <button
                        onClick={(e) => handleDeletePersona(p.id, e)}
                        className="text-[10px] text-red-500 hover:text-red-400 p-0.5"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal truncate">{p.systemPrompt}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Memories */}
          <div className="p-5 flex flex-col gap-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Brain size={13} className="text-[#3D5CFF]" />
              Persistent Memories
            </span>
            <p className="text-[10px] text-slate-500 leading-normal">
              Memories are rules added to the prompt system context.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={newMemoryInput}
                onChange={(e) => setNewMemoryInput(e.target.value)}
                placeholder="Remember: I write TypeScript..."
                className="flex-1 bg-[#070914] border border-white/[0.06] rounded-lg text-[11px] px-2.5 py-1.5 outline-none focus:border-[#3D5CFF] text-slate-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddMemory();
                }}
              />
              <button
                onClick={handleAddMemory}
                className="px-3 bg-gradient-to-r from-[#3D5CFF] to-[#6DD3FF] text-white rounded-lg text-xs font-bold hover:brightness-110 shadow-md transition-all"
              >
                Add
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {memories.length === 0 ? (
                <p className="text-[10px] text-slate-600 italic">No memories active.</p>
              ) : (
                memories.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start p-2 rounded-lg bg-[#070914] border border-white/[0.04] text-[10.5px] text-slate-400 leading-relaxed"
                  >
                    <span className="flex-1 pr-2 break-words">{m}</span>
                    <button
                      onClick={() => handleDeleteMemory(idx)}
                      className="text-slate-600 hover:text-red-400 p-0.5 shrink-0 transition-colors"
                    >
                      &times;
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </aside>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODEL LIBRARY MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showModelLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(7,9,20,0.92)', backdropFilter: 'blur(12px)' }}>
          <div className="w-[900px] max-w-[95vw] max-h-[88vh] rounded-2xl border border-white/[0.08] bg-[#0b0c18] shadow-[0_32px_96px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3D5CFF] to-[#6DD3FF] flex items-center justify-center shadow-[0_0_20px_rgba(61,92,255,0.3)]">
                  <Package size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">Local Model Library</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">{LOCAL_MODEL_LIBRARY.length} models available · runs 100% in your browser · no server required</p>
                </div>
              </div>
              <button onClick={() => setShowModelLibrary(false)} className="p-2 rounded-lg hover:bg-white/[0.05] text-slate-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Filters Bar */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.04] bg-[#070914]/50 shrink-0">
              {/* Search */}
              <div className="relative flex-1 max-w-[280px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={modelSearchQuery}
                  onChange={e => setModelSearchQuery(e.target.value)}
                  placeholder="Search models..."
                  className="w-full pl-8 pr-3 py-2 bg-[#0b0c18] border border-white/[0.06] rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#3D5CFF]/50 transition-colors"
                />
              </div>

              {/* Category filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['all', 'tiny', 'small', 'medium', 'large'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setModelCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                      modelCategoryFilter === cat
                        ? 'bg-[#3D5CFF] border-[#3D5CFF] text-white'
                        : 'bg-transparent border-white/[0.06] text-slate-500 hover:text-slate-300 hover:border-white/[0.1]'
                    }`}
                  >
                    {cat === 'all' ? 'All Sizes' : CATEGORY_LABELS[cat].split(' ')[0] + ' ' + cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Family filter */}
              <select
                value={modelFamilyFilter}
                onChange={e => setModelFamilyFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#0b0c18] border border-white/[0.06] rounded-lg text-[10px] text-slate-300 focus:outline-none focus:border-[#3D5CFF]/50 transition-colors"
              >
                <option value="all">All Families</option>
                {allFamilies.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>

              <span className="text-[10px] text-slate-600 ml-auto shrink-0">{filteredModels.length} results</span>
            </div>

            {/* Model Grid */}
            <div className="overflow-y-auto flex-1 p-6">
              {filteredModels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <Package size={40} className="opacity-20 mb-3" />
                  <p className="text-sm font-semibold">No models match your filters</p>
                  <button onClick={() => { setModelSearchQuery(''); setModelCategoryFilter('all'); setModelFamilyFilter('all'); }} className="mt-3 text-[11px] text-[#3D5CFF] hover:text-[#6DD3FF]">Clear filters</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {filteredModels.map(model => {
                    const isLoaded = loadedModelId === model.id && localModelStatus === 'ready';
                    const isLoading = loadedModelId === model.id && (localModelStatus === 'loading' || localModelStatus === 'progress');
                    const isSelected = localModelId === model.id;
                    const familyColor = FAMILY_COLORS[model.family] || '#3D5CFF';

                    return (
                      <div
                        key={model.id}
                        className={`relative flex flex-col gap-3 p-4 rounded-xl border cursor-pointer transition-all group hover:border-white/[0.12] ${
                          isSelected
                            ? 'border-[#3D5CFF]/50 bg-[#3D5CFF]/5 shadow-[0_0_20px_rgba(61,92,255,0.08)]'
                            : 'border-white/[0.05] bg-[#070914]/60 hover:bg-white/[0.02]'
                        }`}
                      >
                        {/* Badge */}
                        {model.badge && (
                          <span className="absolute top-3 right-3 text-[8px] font-bold px-2 py-0.5 rounded-full bg-[#3D5CFF]/15 border border-[#3D5CFF]/25 text-[#6DD3FF]">
                            {model.badge}
                          </span>
                        )}

                        {/* Header */}
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black shrink-0 text-white"
                            style={{ background: `${familyColor}25`, border: `1px solid ${familyColor}40` }}
                          >
                            <span style={{ color: familyColor }}>{model.family.substring(0, 2)}</span>
                          </div>
                          <div className="flex-1 min-w-0 pr-14">
                            <p className="text-xs font-bold text-white leading-tight truncate">{model.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{model.family} · {model.sizeMB >= 1000 ? `${(model.sizeMB / 1024).toFixed(1)}GB` : `${model.sizeMB}MB`}</p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-[10.5px] text-slate-400 leading-relaxed line-clamp-2">{model.description}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                            model.category === 'tiny' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            model.category === 'small' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                            model.category === 'medium' ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' :
                            'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>
                            {model.category}
                          </span>
                          {model.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-slate-500">
                              {tag}
                            </span>
                          ))}
                          {model.recommended && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#3D5CFF]/10 border border-[#3D5CFF]/25 text-[#6DD3FF]">
                              ★ Recommended
                            </span>
                          )}
                        </div>

                        {/* HF ID */}
                        <p className="text-[9px] text-slate-600 font-mono truncate">{model.id}</p>

                        {/* Action row */}
                        <div className="flex items-center gap-2 mt-auto pt-1 border-t border-white/[0.04]">
                          {isLoaded ? (
                            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                              <ShieldCheck size={12} />
                              Loaded & Ready
                            </div>
                          ) : isLoading ? (
                            <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-bold">
                              <Loader2 size={12} className="animate-spin" />
                              {localModelStatus === 'progress' ? `Downloading ${localModelPercent}%` : 'Loading...'}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleLoadModel(model.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3D5CFF] hover:bg-[#3D5CFF]/80 text-white text-[10px] font-bold rounded-lg transition-all shadow-md hover:shadow-[0_0_12px_rgba(61,92,255,0.3)] active:scale-95"
                            >
                              <Download size={11} />
                              {isSelected ? 'Load This Model' : 'Download & Use'}
                            </button>
                          )}

                          <a
                            href={`https://huggingface.co/${model.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="ml-auto flex items-center gap-1 text-[9px] text-slate-600 hover:text-slate-400 transition-colors"
                          >
                            HuggingFace <ExternalLink size={9} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-white/[0.04] bg-[#070914]/60 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <WifiOff size={11} className="text-emerald-400" />
                <span>Models are cached in your browser after first download · Works fully offline</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <ShieldCheck size={11} className="text-[#3D5CFF]" />
                <span>All inference runs locally — your data never leaves this device</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModelDownloadOverlay
        visible={engineMode === 'local' && !isRestoringModel && (localModelStatus === 'loading' || localModelStatus === 'progress')}
        modelName={selectedModelInfo?.name || localModelId.split('/').pop() || localModelId}
        progress={downloadProgress}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          API KEYS MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(7,9,20,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="w-[480px] rounded-2xl border border-white/[0.08] bg-[#0b0c18] shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#3D5CFF]/10 border border-[#3D5CFF]/25 flex items-center justify-center">
                  <KeyRound size={15} className="text-[#6DD3FF]" />
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

            <div className="flex border-b border-white/[0.06]">
              {(['gemini', 'groq', 'openrouter', 'huggingface'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => { setApiKeyTab(p); setApiKeyInput(apiKeys[p] || ''); setShowApiKeyValue(false); setApiKeySaved(false); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all ${
                    apiKeyTab === p
                      ? 'border-[#3D5CFF] text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${ apiKeys[p] ? 'bg-emerald-400' : 'bg-slate-600' }`}></span>
                  {{ gemini: 'Google Gemini', groq: 'Groq', openrouter: 'OpenRouter', huggingface: 'Hugging Face' }[p]}
                </button>
              ))}
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="rounded-xl bg-[#070914] border border-white/[0.04] px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{{ gemini: 'Google Gemini API', groq: 'Groq Cloud API', openrouter: 'OpenRouter API', huggingface: 'Hugging Face Token' }[apiKeyTab]}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{{ gemini: 'Free tier available · aistudio.google.com', groq: 'Free tier available · console.groq.com', openrouter: 'Free models available · openrouter.ai/keys', huggingface: 'Required for gated/private models · huggingface.co/settings/tokens' }[apiKeyTab]}</p>
                </div>
                {apiKeys[apiKeyTab] ? (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">✓ ACTIVE</span>
                ) : apiKeyTab === 'huggingface' && serverHfConfigured ? (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">✓ SERVER DEFAULT</span>
                ) : (
                  <span className="text-[9px] font-bold text-slate-500 bg-white/[0.03] border border-white/[0.06] px-2 py-1 rounded-full">NOT SET</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Your API Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKeyValue ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      placeholder={{ gemini: 'AIza...', groq: 'gsk_...', openrouter: 'sk-or-...', huggingface: 'hf_...' }[apiKeyTab]}
                      className="w-full px-3 pr-9 py-2.5 rounded-lg bg-[#070914] border border-white/[0.06] text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-[#3D5CFF]/50 transition-colors"
                    />
                    <button
                      onClick={() => setShowApiKeyValue(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
                    >
                      {showApiKeyValue ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  <button
                    onClick={saveApiKey}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      apiKeySaved
                        ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400'
                        : 'bg-[#3D5CFF] hover:bg-[#3D5CFF]/80 text-white'
                    }`}
                  >
                    {apiKeySaved ? <><Check size={13} className="inline mr-1" />Saved!</> : 'Save'}
                  </button>
                </div>
              </div>

              {apiKeys[apiKeyTab] && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                  <p className="text-[10.5px] text-emerald-400">Custom key active — overrides server default</p>
                  <button
                    onClick={() => removeApiKey(apiKeyTab)}
                    className="text-[10px] font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={10} /> Remove
                  </button>
                </div>
              )}

              <div className="bg-slate-950/60 border border-white/[0.04] p-3 rounded-xl flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                  <HelpCircle size={12} className="text-indigo-400" />
                  How to get your {apiKeyTab === 'gemini' ? 'Google Gemini' : apiKeyTab === 'groq' ? 'Groq Cloud' : apiKeyTab === 'openrouter' ? 'OpenRouter' : 'Hugging Face'} key
                </div>
                {apiKeyTab === 'gemini' && (
                  <div className="flex flex-col gap-1.5 text-[10px] text-slate-400 leading-normal">
                    <div className="flex items-start gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">1</span><p>Go to <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-0.5">Google AI Studio <ExternalLink size={8} /></a>.</p></div>
                    <div className="flex items-start gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">2</span><p>Sign in with your Google account.</p></div>
                    <div className="flex items-start gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">3</span><p>Click <strong className="text-slate-300">"Create API Key"</strong> and copy it (starts with <code className="font-mono text-indigo-300">AIzaSy</code>).</p></div>
                  </div>
                )}
                {apiKeyTab === 'groq' && (
                  <div className="flex flex-col gap-1.5 text-[10px] text-slate-400 leading-normal">
                    <div className="flex items-start gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">1</span><p>Open <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-0.5">Groq Cloud Console <ExternalLink size={8} /></a>.</p></div>
                    <div className="flex items-start gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">2</span><p>Create free account → API Keys tab → Create Key (<code className="font-mono text-indigo-300">gsk_</code>).</p></div>
                  </div>
                )}
                {apiKeyTab === 'openrouter' && (
                  <div className="flex flex-col gap-1.5 text-[10px] text-slate-400 leading-normal">
                    <div className="flex items-start gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">1</span><p>Visit <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-0.5">OpenRouter.ai <ExternalLink size={8} /></a> and sign up.</p></div>
                    <div className="flex items-start gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">2</span><p>Go to Keys → Create key (<code className="font-mono text-indigo-300">sk-or-</code>). Free models need no credits!</p></div>
                  </div>
                )}
                {apiKeyTab === 'huggingface' && (
                  <div className="flex flex-col gap-1.5 text-[10px] text-slate-400 leading-normal">
                    <div className="flex items-start gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">1</span><p>Go to <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-0.5">Hugging Face Access Tokens <ExternalLink size={8} /></a>.</p></div>
                    <div className="flex items-start gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">2</span><p>Create a token with <strong className="text-slate-350">"Read"</strong> access role.</p></div>
                    <div className="flex items-start gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[8px] font-bold text-indigo-400 shrink-0 mt-0.5">3</span><p>Copy the token (starts with <code className="font-mono text-indigo-300">hf_</code>) and paste it here.</p></div>
                  </div>
                )}
              </div>

              <p className="text-[9.5px] text-slate-600 leading-relaxed">
                🔒 Keys are stored in your browser&apos;s localStorage. They are sent directly to the AI provider per request and are never logged or stored on our servers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Error Popup ── */}
      {errorPopup.visible && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] rounded-2xl border border-red-500/25 bg-[#0b0c18] shadow-[0_8px_40px_rgba(239,68,68,0.18)] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="h-0.5 w-full bg-gradient-to-r from-red-500/60 via-amber-400/60 to-red-500/60"></div>
          <div className="p-4 flex flex-col gap-3">
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
                        : errorPopup.message === 'Model runtime crashed (out of memory)' ||
                          errorPopup.message === 'Model runtime failed (WASM/WebGPU)' ||
                          errorPopup.message === 'Not enough browser memory'
                          ? 'OUT OF MEMORY'
                          : 'ERROR'}
                  </p>
                </div>
              </div>
              <button onClick={dismissError} className="p-1 rounded-md hover:bg-white/[0.04] text-slate-500 hover:text-white transition-colors shrink-0">
                <X size={14} />
              </button>
            </div>
            {errorPopup.reason && (
              <div className="rounded-lg bg-[#070914] border border-white/[0.04] px-3 py-2.5 text-[10.5px] text-slate-400 font-mono leading-relaxed line-clamp-4">
                {errorPopup.reason.length > 220 ? errorPopup.reason.substring(0, 220) + '...' : errorPopup.reason}
              </div>
            )}
            <div className="flex items-center gap-2 pt-0.5">
              <RefreshCcw size={11} className="text-[#3D5CFF] shrink-0" />
              <p className="text-[10px] text-slate-500 leading-snug">
                {errorPopup.message === 'Model not available' ? (
                  <>Pick another model from the <span className="text-[#6DD3FF] font-semibold">Model Library</span> — it should open automatically.</>
                ) : errorPopup.message === 'WebGPU required for this model' ? (
                  <>Use Chrome 113+ or Edge 113+, or pick a smaller model from the <span className="text-[#6DD3FF] font-semibold">Model Library</span>.</>
                ) : errorPopup.message === 'Model runtime crashed (out of memory)' ||
                  errorPopup.message === 'Model runtime failed (WASM/WebGPU)' ||
                  errorPopup.message === 'Not enough browser memory' ? (
                  <>Close other tabs, refresh the page, then try a smaller model from the <span className="text-[#6DD3FF] font-semibold">Model Library</span>.</>
                ) : (
                  <>Switch the model from the <span className="text-[#6DD3FF] font-semibold">top controls</span> to try again.</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Keyboard Shortcut Modal ── */}
      {showShortcutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[360px] rounded-2xl border border-white/[0.06] bg-[#0b0c18] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
            <h3 className="text-sm font-bold text-white mb-4">Command Options</h3>
            <div className="space-y-3 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5"><span>Cmd + K / Ctrl + K</span><span className="text-[#6DD3FF]">Open Shortcuts</span></div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5"><span>Enter</span><span className="text-[#6DD3FF]">Send Message</span></div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5"><span>Shift + Enter</span><span className="text-[#6DD3FF]">New Text Line</span></div>
              <div className="flex justify-between"><span>Space Tab</span><span className="text-[#6DD3FF]">Focus Text Box</span></div>
            </div>
            <button
              onClick={() => setShowShortcutModal(false)}
              className="mt-6 w-full py-2 bg-[#3D5CFF] text-white font-bold rounded-lg text-xs shadow-md hover:brightness-110 active:scale-98 transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Custom Persona Modal ── */}
      {showCustomPersonaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[420px] rounded-2xl border border-white/[0.06] bg-[#0b0c18] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Create Custom Persona</h3>
              <p className="text-[10px] text-slate-500 mt-1">Setup custom prompt instructions for Vibe Assistant.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Persona Name</label>
              <input
                type="text"
                placeholder="e.g. Tailwind Pro"
                value={customPersonaName}
                onChange={(e) => setCustomPersonaName(e.target.value)}
                className="bg-[#070914] border border-white/[0.06] rounded-lg text-xs px-3 py-2 outline-none focus:border-[#3D5CFF] text-slate-200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">System Prompt / Instructions</label>
              <textarea
                placeholder="e.g. You are an expert Tailwind utility CSS styling developer. Always reply with concise code snippets."
                value={customPersonaPrompt}
                onChange={(e) => setCustomPersonaPrompt(e.target.value)}
                rows={4}
                className="bg-[#070914] border border-white/[0.06] rounded-lg text-xs px-3 py-2 outline-none focus:border-[#3D5CFF] text-slate-200 resize-none"
              />
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setCustomPersonaName(''); setCustomPersonaPrompt(''); setShowCustomPersonaModal(false); }}
                className="flex-1 py-2 bg-transparent hover:bg-white/[0.04] text-slate-400 font-bold rounded-lg text-xs border border-white/[0.04]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomPersona}
                disabled={!customPersonaName.trim() || !customPersonaPrompt.trim()}
                className="flex-1 py-2 bg-gradient-to-r from-[#3D5CFF] to-[#6DD3FF] text-white font-bold rounded-lg text-xs shadow-md hover:brightness-110 disabled:opacity-30 disabled:pointer-events-none active:scale-98 transition-all"
              >
                Save Persona
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
