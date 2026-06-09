'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    systemPrompt: 'You are a chill, highly skilled agentic AI coding assistant. You speak with some tech slang, emoji, and absolute confidence. Keep code clean, modern, and beautiful.'
  },
  {
    id: 'plain',
    name: 'Plain',
    systemPrompt: 'Answer queries as briefly, directly, and plainly as possible. Omit headers, conversational filler, and detailed explanations unless explicitly asked.'
  },
  {
    id: 'mentor',
    name: 'Mentor',
    systemPrompt: 'You are a patient senior software engineer mentor. Provide thorough explanations, highlight potential bugs, write comments explaining every line of code, and guide the user through logical steps.'
  }
];

export default function AssistantPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [promptInput, setPromptInput] = useState('');
  
  // Model & Engine Configuration
  const [engineMode, setEngineMode] = useState<'server' | 'local'>('server');
  const [serverModel, setServerModel] = useState('gemini-2.5-flash');
  const [localModel, setLocalModel] = useState('Xenova/TinyLlama-1.1B-Chat-v1.0');
  const [generationActive, setGenerationActive] = useState(false);

  // Local model state tracking
  const [localModelStatus, setLocalModelStatus] = useState<'idle' | 'loading' | 'progress' | 'ready' | 'error'>('idle');
  const [localModelMsg, setLocalModelMsg] = useState('Local Model Offline (Click to Initialize)');
  const [localModelPercent, setLocalModelPercent] = useState(0);

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
  const [apiKeyTab, setApiKeyTab] = useState<'gemini' | 'groq' | 'openrouter'>('gemini');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeyValue, setShowApiKeyValue] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Ref to track the active chat ID synchronously (state updates are async, so this is reliable)
  const pendingChatIdRef = useRef<string | null>(null);

  // Load configuration and initialize worker
  useEffect(() => {
    loadChatSessions();
    loadApiKeys();

    // Load memories from localStorage
    const savedMemories = localStorage.getItem('zentro-memories');
    if (savedMemories) {
      setMemories(JSON.parse(savedMemories));
    }

    // Load custom personas from localStorage
    const savedPersonas = localStorage.getItem('zentro-custom-personas');
    if (savedPersonas) {
      setPersonas([...DEFAULT_PERSONAS, ...JSON.parse(savedPersonas)]);
    }

    const savedActivePersona = localStorage.getItem('zentro-active-persona');
    if (savedActivePersona) {
      setActivePersonaId(savedActivePersona);
    }

    // Spawn Web Worker for local AI (must be type:module to support ES module imports)
    workerRef.current = new Worker('/ai-worker.js', { type: 'module' });
    
    workerRef.current.onmessage = (event) => {
      const { status, message, progress, token, error, result } = event.data;

      if (status === 'loading') {
        setLocalModelStatus('loading');
        setLocalModelMsg(message);
      } else if (status === 'progress') {
        setLocalModelStatus('progress');
        const pct = Math.round(progress);
        setLocalModelPercent(pct);
        setLocalModelMsg(`Downloading model files... ${pct}%`);
      } else if (status === 'ready') {
        setLocalModelStatus('ready');
        setLocalModelMsg('Local AI Active (Ready offline)');
      } else if (status === 'generating') {
        // Handle streaming if available, else show loading
      } else if (status === 'complete') {
        handleLocalModelCompletion(result, pendingChatIdRef.current);
      } else if (status === 'error') {
        setLocalModelStatus('error');
        setLocalModelMsg('Local AI Error: ' + error);
        setGenerationActive(false);
      }
    };

    // Catch worker-level errors (import failures, syntax errors, etc)
    workerRef.current.onerror = (err) => {
      console.error('[AI Worker Error]', err);
      setLocalModelStatus('error');
      setLocalModelMsg('Worker failed to load: ' + (err.message || 'Check console for details'));
    };

    // Global keyboard shortcuts (Cmd+K for command palette/actions, Cmd+Enter to send)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowShortcutModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      workerRef.current?.terminate();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync scroll to chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat sessions
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

  // Manage Memories
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

  // Manage Personas
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
    if (activePersonaId === id) {
      handleSelectPersona('vibe');
    }
  };

  // Switch local model weights downloader
  const handleInitLocalModel = () => {
    if (localModelStatus === 'ready' || localModelStatus === 'loading' || localModelStatus === 'progress') return;
    workerRef.current?.postMessage({ type: 'load', data: { model: localModel } });
  };

  // ─── API Key Helpers ───
  const loadApiKeys = () => {
    const stored: Record<string, string> = {};
    ['gemini', 'groq', 'openrouter'].forEach(p => {
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

  // Resolve which key to use: user key → server key (handled server-side)
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

  // Compose Full System Instruction (combining Persona system prompt + memory guidelines)
  const compileSystemPrompt = () => {
    const activePersona = personas.find(p => p.id === activePersonaId);
    let system = activePersona ? activePersona.systemPrompt : DEFAULT_PERSONAS[0].systemPrompt;
    
    if (memories.length > 0) {
      system += `\n\nTake into account these personal memory guidelines from the user:\n` + 
        memories.map(m => `- ${m}`).join('\n');
    }
    return system;
  };

  // Send Prompt handler
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
        showError('Local model not ready', 'Please download the Local LLM weights first using the top bar control.');
        setGenerationActive(false);
        return;
      }
      
      // Set the pendingChatIdRef BEFORE posting to worker (state update is async)
      pendingChatIdRef.current = chatId;

      // Request Web Worker local chat inference
      const formattedHistory = updatedHistory.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content
      }));

      workerRef.current?.postMessage({
        type: 'chat',
        data: {
          prompt: text,
          history: formattedHistory,
          systemPrompt
        }
      });
    } else {
      // Call Next.js API chat route
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

          setPromptInput(text); // Preserve user input on error
          showError('Credits got over — quota exhausted!', errMsg);
          setGenerationActive(false);
          return;
        }

        const data = await response.json();
        if (data.error) {
          setPromptInput(text); // Preserve user input on error
          showError('Credits got over — quota exhausted!', data.error);
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
        setPromptInput(text); // Preserve user input on error
        showError('Credits got over — quota exhausted!', err?.message || 'Network or provider error. Please try a different model.');
        setGenerationActive(false);
      }
    }
  };

  const handleSendPrompt = async () => {
    await handleSendPromptText(promptInput);
  };

  // Local Worker callback receiver
  const handleLocalModelCompletion = async (result: string, chatId: string | null) => {
    // Use the passed chatId (from ref) - never rely on currentChatId state here
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

  // Utility copy code block / text bubble
  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Quick suggestions buttons helper
  const handleSuggestionClick = (suffix: string) => {
    if (messages.length === 0) return;
    const lastMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastMsg) {
      handleSendPromptText(`Regarding your previous prompt: "${lastMsg.content}". Can you please make the response ${suffix}?`);
    }
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden bg-[#070914] text-slate-200 relative ${powerMode ? 'border-2 border-[#3D5CFF]/30 shadow-[0_0_30px_rgba(61,92,255,0.1)]' : ''}`}>
      
      {/* Decorative background visual sparkles under power mode */}
      {powerMode && (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(61,92,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(61,92,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10 animate-pulse"></div>
      )}

      {/* Top Header Bar */}
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

        {/* Configurations */}
        <div className="flex items-center gap-4">
          
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
              <Server size={12} /> Server Engine
            </button>
            <button
              onClick={() => setEngineMode('local')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                engineMode === 'local' 
                  ? 'bg-[#3D5CFF] text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu size={12} /> Local AI (Offline)
            </button>
          </div>

          {/* Model selection dropdown */}
          {engineMode === 'server' ? (
            <select
              value={serverModel}
              onChange={(e) => setServerModel(e.target.value)}
              className="px-3 py-1.5 bg-[#070914] border border-white/[0.06] rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-[#3D5CFF] transition-all"
            >
              <optgroup label="Google Gemini API">
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
              </optgroup>
              <optgroup label="Groq Cloud API">
                <option value="groq/llama-3.3-70b-versatile">Llama 3.3 70B (Groq)</option>
                <option value="groq/llama-3.1-70b-versatile">Llama 3.1 70B (Groq)</option>
              </optgroup>
              <optgroup label="OpenRouter API (Free)">
                <option value="openrouter/meta-llama/llama-3.1-8b-instruct:free">Llama 3.1 8B Free</option>
                <option value="openrouter/google/gemma-2-9b-it:free">Gemma 2 9B Free</option>
              </optgroup>
            </select>
          ) : (
            <select
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="px-3 py-1.5 bg-[#070914] border border-white/[0.06] rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-[#3D5CFF] transition-all"
            >
              <option value="Xenova/TinyLlama-1.1B-Chat-v1.0">TinyLlama 1.1B Chat (Best Quality ~650MB)</option>
              <option value="Xenova/Qwen1.5-0.5B-Chat">Qwen 1.5 0.5B Chat (~300MB)</option>
              <option value="Xenova/LaMini-GPT-124M">LaMini GPT 124M (⚡ Fastest ~250MB)</option>
            </select>
          )}

          {/* Local Loader control */}
          {engineMode === 'local' && (
            <button
              onClick={handleInitLocalModel}
              disabled={localModelStatus === 'ready' || localModelStatus === 'loading' || localModelStatus === 'progress'}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all ${
                localModelStatus === 'ready' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' :
                localModelStatus === 'loading' || localModelStatus === 'progress' ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-400 cursor-default' :
                'bg-[#070914] border-white/[0.06] text-slate-400 hover:text-slate-200'
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

          {/* Workspace Link */}
          <Link
            href="/workspace"
            className="flex items-center gap-1.5 px-4.5 py-1.5 bg-[#0b0c18] border border-white/[0.06] hover:border-[#3D5CFF]/30 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all"
          >
            Launch Builder <Sparkles size={11} className="text-[#6DD3FF]" />
          </Link>
        </div>
      </header>

      {/* Main Split Grid */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar: Conversational threads */}
        <aside className="w-[260px] border-r border-white/[0.04] bg-[#0b0c18]/40 shrink-0 flex flex-col justify-between">
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

          {/* Quick Help Footer */}
          <div className="p-4 border-t border-white/[0.04] bg-[#070914]/80 flex flex-col gap-2">
            <button 
              onClick={() => setShowShortcutModal(true)}
              className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-slate-300 font-semibold transition-colors"
            >
              <HelpCircle size={12} /> Keyboard Shortcuts
            </button>
            <div className="text-[9px] text-slate-600 leading-tight">
              All general conversations run 100% on-device or via direct secure provider routing.
            </div>
          </div>
        </aside>

        {/* Center: Main Chat View */}
        <main className="flex-1 flex flex-col justify-between bg-[#070914] relative">
          
          {/* Chat config row */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/[0.04] bg-[#0b0c18]/20 shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Configure Vibe:</span>
              
              {/* Power Mode button */}
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
              Active Persona: <span className="text-[#6DD3FF] font-semibold">{personas.find(p => p.id === activePersonaId)?.name}</span>
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
                  Select a persona and memory rule, then write prompts. Runs offline cached models or direct cloud APIs.
                </p>
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
                    
                    {/* Message Action Bar (floating on hover) */}
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => handleCopyMessage(m.id!, m.content)}
                        className="p-1 rounded bg-[#070914] border border-white/[0.04] hover:border-[#3D5CFF]/30 text-slate-400 hover:text-white transition-colors"
                        title="Copy message content"
                      >
                        {copiedMessageId === m.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      </button>
                    </div>

                    {/* Content render formatting */}
                    <div className="whitespace-pre-wrap font-sans">
                      {m.content.includes('```') ? (
                        // Render code formatting layout
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

            {/* Loading Indicator */}
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

          {/* Prompt quick suffix bar */}
          {messages.length > 0 && !generationActive && (
            <div className="flex gap-2 px-6 pb-2 shrink-0 overflow-x-auto">
              <span className="text-[10px] text-slate-500 font-bold shrink-0 self-center uppercase tracking-wider mr-1">Modify Response:</span>
              {[
                { label: "Make shorter", value: "shorter and more brief" },
                { label: "Explain deeper", value: "more detailed, explaining the logic step-by-step" },
                { label: "Add comments", value: "fully documented with detailed code comments" },
                { label: "Check performance", value: "reviewed for performance efficiency and complexity" }
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

          {/* Bottom input area */}
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
                  Press Enter to send, Shift+Enter for new line
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setPromptInput(prev => prev + text);
                      } catch (err) {
                        showError('Clipboard permission denied', 'Allow clipboard access in your browser settings to use the Paste button.');
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

        {/* ─── API Keys Settings Modal ─── */}
        {showApiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(7,9,20,0.85)', backdropFilter: 'blur(8px)' }}>
            <div className="w-[480px] rounded-2xl border border-white/[0.08] bg-[#0b0c18] shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
              {/* Modal header */}
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

              {/* Provider tabs */}
              <div className="flex border-b border-white/[0.06]">
                {(['gemini', 'groq', 'openrouter'] as const).map(p => (
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
                    {{ gemini: 'Google Gemini', groq: 'Groq', openrouter: 'OpenRouter' }[p]}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-5 flex flex-col gap-4">
                {/* Provider info */}
                <div className="rounded-xl bg-[#070914] border border-white/[0.04] px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{{
                      gemini: 'Google Gemini API',
                      groq: 'Groq Cloud API',
                      openrouter: 'OpenRouter API'
                    }[apiKeyTab]}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{{
                      gemini: 'Free tier available · aistudio.google.com',
                      groq: 'Free tier available · console.groq.com',
                      openrouter: 'Free models available · openrouter.ai/keys'
                    }[apiKeyTab]}</p>
                  </div>
                  {apiKeys[apiKeyTab] ? (
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">✓ ACTIVE</span>
                  ) : (
                    <span className="text-[9px] font-bold text-slate-500 bg-white/[0.03] border border-white/[0.06] px-2 py-1 rounded-full">SERVER DEFAULT</span>
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
                        placeholder={{
                          gemini: 'AIza...',
                          groq: 'gsk_...',
                          openrouter: 'sk-or-...'
                        }[apiKeyTab]}
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

                {/* Saved key actions */}
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

                {/* API Walkthrough Help Card */}
                <div className="bg-slate-950/60 border border-white/[0.04] p-3 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-355 uppercase tracking-wider">
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
                  🔒 Keys are stored in your browser&apos;s localStorage. They are sent directly to the AI provider per request and are never logged or stored on our servers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Credits / Error Popup Banner ─── */}
        {errorPopup.visible && (
          <div className="fixed bottom-6 right-6 z-50 w-[380px] rounded-2xl border border-red-500/25 bg-[#0b0c18] shadow-[0_8px_40px_rgba(239,68,68,0.18)] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
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
                    <p className="text-[10px] text-red-400 font-semibold mt-0.5 tracking-wide">API QUOTA / RATE LIMIT</p>
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
                <div className="rounded-lg bg-[#070914] border border-white/[0.04] px-3 py-2.5 text-[10.5px] text-slate-400 font-mono leading-relaxed line-clamp-4">
                  {errorPopup.reason.length > 220 ? errorPopup.reason.substring(0, 220) + '...' : errorPopup.reason}
                </div>
              )}

              {/* Action hint */}
              <div className="flex items-center gap-2 pt-0.5">
                <RefreshCcw size={11} className="text-[#3D5CFF] shrink-0" />
                <p className="text-[10px] text-slate-500 leading-snug">
                  Switch the model from the <span className="text-[#6DD3FF] font-semibold">top dropdown</span> to Groq or OpenRouter and try again.
                </p>
              </div>

              {/* Auto-dismiss progress bar */}
              <div className="h-0.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-500 to-amber-400 animate-[shrink_8s_linear_forwards]"
                  style={{ width: '100%', animation: 'width 8s linear forwards' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Right Sidebar: Memories & System Personas */}
        <aside className="w-[300px] border-l border-white/[0.04] bg-[#0b0c18]/45 shrink-0 flex flex-col divide-y divide-white/[0.04] overflow-y-auto">
          
          {/* Section 1: Personas Presets */}
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

          {/* Section 2: Personal Memories context */}
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

      {/* Keyboard Shortcut Modal */}
      {showShortcutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[360px] rounded-2xl border border-white/[0.06] bg-[#0b0c18] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
            <h3 className="text-sm font-bold text-white mb-4">Command Options</h3>
            <div className="space-y-3 font-mono text-[11px] text-slate-400">
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span>Cmd + K / Ctrl + K</span>
                <span className="text-[#6DD3FF]">Open Shortcuts</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span>Enter</span>
                <span className="text-[#6DD3FF]">Send Message</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span>Shift + Enter</span>
                <span className="text-[#6DD3FF]">New Text Line</span>
              </div>
              <div className="flex justify-between">
                <span>Space Tab</span>
                <span className="text-[#6DD3FF]">Focus Text Box</span>
              </div>
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

      {/* Add Custom Persona Modal */}
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
                onClick={() => {
                  setCustomPersonaName('');
                  setCustomPersonaPrompt('');
                  setShowCustomPersonaModal(false);
                }}
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
