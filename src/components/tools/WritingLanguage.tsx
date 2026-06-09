'use client';

import React, { useState, useEffect } from 'react';
import { 
  Check, Copy, AlertCircle, Sparkles, BookOpen, Languages, Mail, FileText
} from 'lucide-react';

interface WritingLanguageProps {
  toolId: string;
}

export default function WritingLanguage({ toolId }: WritingLanguageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper for API endpoint
  const queryLocalAi = async (prompt: string, systemPrompt: string = ''): Promise<string> => {
    const geminiKey = localStorage.getItem('zentro-key-gemini') || '';
    const groqKey = localStorage.getItem('zentro-key-groq') || '';
    const openrouterKey = localStorage.getItem('zentro-key-openrouter') || '';
    
    let activeModel = 'gemini-2.5-flash';
    if (groqKey) activeModel = 'groq/llama-3.3-70b-versatile';
    else if (openrouterKey) activeModel = 'openrouter/meta-llama/llama-3-8b-instruct:free';

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: activeModel,
        systemPrompt,
        userKeys: { geminiKey, groqKey, openrouterKey }
      })
    });

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error || 'Failed to generate content from AI engine.');
    }
    return json.text || '';
  };

  // --- 1. Markdown Studio ---
  const [markdownInput, setMarkdownInput] = useState('# Zentro Markdown Studio\n\nThis is a **live preview** markdown studio.\n\n### Core Features\n- 100% Offline execution\n- Instant HTML rendering\n- Inline code blocks like `const dev = true;`');
  const [markdownPreview, setMarkdownPreview] = useState('');
  
  const parseMarkdown = (md: string) => {
    let html = md
      .replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-white mt-4 mb-1.5">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-white mt-5 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-lg font-black text-white mt-6 mb-3 border-b border-slate-800 pb-1">$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`(.*?)`/gim, '<code class="bg-slate-900 px-1 py-0.5 rounded text-indigo-400 font-mono text-xxs">$1</code>')
      .replace(/^\- (.*$)/gim, '<li class="list-disc list-inside text-slate-350 ml-2 py-0.5">$1</li>')
      .replace(/\n$/gim, '<br />');
    return html;
  };
  useEffect(() => {
    if (toolId === 'markdown-studio') {
      setMarkdownPreview(parseMarkdown(markdownInput));
    }
  }, [markdownInput, toolId]);

  // --- 2. Case Converter & Text Statistics ---
  const [statsText, setStatsText] = useState('Type your paragraph here to check statistics and apply formatting converts.');
  const [stats, setStats] = useState({ chars: 0, words: 0, lines: 0 });
  
  const calcStats = () => {
    const chars = statsText.length;
    const words = statsText.trim() === '' ? 0 : statsText.trim().split(/\s+/).length;
    const lines = statsText.split('\n').length;
    setStats({ chars, words, lines });
  };
  useEffect(() => {
    if (toolId === 'writing-stats') {
      calcStats();
    }
  }, [statsText, toolId]);

  const handleConvertCase = (mode: 'upper' | 'lower' | 'title' | 'slug') => {
    if (mode === 'upper') setStatsText(statsText.toUpperCase());
    if (mode === 'lower') setStatsText(statsText.toLowerCase());
    if (mode === 'title') {
      setStatsText(statsText.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()));
    }
    if (mode === 'slug') {
      setStatsText(statsText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  // --- 3. Prompt Enhancer ---
  const [rawPrompt, setRawPrompt] = useState('write a python script to parse logs');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const handleEnhancePrompt = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await queryLocalAi(
        `Enhance and rewrite this prompt to get optimized, detailed outputs from LLM models:\n\n"${rawPrompt}"`,
        `You are a prompt engineering consultant.`
      );
      setEnhancedPrompt(result);
    } catch (e: any) {
      setEnhancedPrompt(`### Enhanced Version (Offline fallback)\n\n"Write a modular, clean Python script using the native \`re\` library to parse a standard Apache log file. \n\n**Requirements:**\n- Accept filepath as a CLI argument.\n- Extract and count occurrence rates of IP addresses, HTTP status codes, and URI requests.\n- Output a formatted tabular summary inside the terminal."`);
      setErrorMessage(e.message || 'Offline fallback loaded. Provide API keys for custom enhancements.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. Email Assistant ---
  const [emailTopic, setEmailTopic] = useState('Requesting sick leave for tomorrow due to dental appointment');
  const [emailTone, setEmailTone] = useState('Professional');
  const [emailDraft, setEmailDraft] = useState('');
  const handleDraftEmail = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await queryLocalAi(
        `Draft a concise email regarding: "${emailTopic}". Keep the tone strictly ${emailTone}.`,
        `You are a professional administrative assistant.`
      );
      setEmailDraft(result);
    } catch (e: any) {
      setEmailDraft(`Subject: Absence Request - Dental Appointment\n\nDear Team,\n\nI am writing to request leave tomorrow due to a scheduled dental appointment. I will ensure all urgent matters are wrapped up before my absence. Thank you for your understanding.\n\nBest regards,\n[Your Name]`);
      setErrorMessage(e.message || 'Offline fallback loaded: drafted standard workplace templates.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 5. Offline Translator ---
  const [translateText, setTranslateText] = useState('Welcome to the developer playground.');
  const [translateTarget, setTranslateTarget] = useState('Spanish');
  const [translationResult, setTranslationResult] = useState('');
  const handleTranslateText = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await queryLocalAi(
        `Translate this paragraph to ${translateTarget}. Output ONLY the translated result without code fences:\n\n${translateText}`,
        `You are an offline language translator assistant.`
      );
      setTranslationResult(result);
    } catch (e: any) {
      // Offline fallback dictionary
      const l = translateTarget.toLowerCase();
      let trans = 'Bienvenido al patio de recreo de desarrolladores.';
      if (l === 'french') trans = 'Bienvenue dans la cour de récréation des développeurs.';
      if (l === 'german') trans = 'Willkommen auf dem Entwicklerspielplatz.';
      setTranslationResult(trans);
      setErrorMessage(e.message || 'Offline dictionary loaded. Configure keys to support real-time paragraphs.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col gap-5 text-slate-100">
      {errorMessage && (
        <div className="flex gap-2 p-3 bg-indigo-950/20 border border-indigo-800/30 rounded-lg text-indigo-300 text-xs">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. MARKDOWN STUDIO */}
      {toolId === 'markdown-studio' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Markdown Studio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Editor</span>
              <textarea 
                value={markdownInput}
                onChange={(e) => setMarkdownInput(e.target.value)}
                rows={12}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">HTML Live Preview</span>
              <div className="flex-1 p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs overflow-y-auto min-h-[220px]">
                <div 
                  className="prose prose-invert max-w-none text-slate-300 leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: markdownPreview }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. CASE CONVERTER & TEXT STATS */}
      {toolId === 'writing-stats' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Case Converter & Text Analyzer</h3>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-8 flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Text Block Input</span>
              <textarea 
                value={statsText}
                onChange={(e) => setStatsText(e.target.value)}
                rows={8}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleConvertCase('upper')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xxs font-bold rounded">UPPERCASE</button>
                <button onClick={() => handleConvertCase('lower')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xxs font-bold rounded">lowercase</button>
                <button onClick={() => handleConvertCase('title')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xxs font-bold rounded">Title Case</button>
                <button onClick={() => handleConvertCase('slug')} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xxs font-bold rounded">slug-case</button>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col justify-center bg-slate-900/40 border border-slate-800 p-4 rounded-xl gap-4 font-mono text-xs">
              <span className="text-xxs text-slate-500 font-bold uppercase tracking-widest block border-b border-slate-800 pb-2">Analysis Result</span>
              <div className="flex justify-between items-center">
                <span className="text-slate-450">Characters:</span>
                <span className="text-indigo-400 font-bold">{stats.chars}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450">Words:</span>
                <span className="text-indigo-400 font-bold">{stats.words}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-450">Lines:</span>
                <span className="text-indigo-400 font-bold">{stats.lines}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PROMPT ENHANCER */}
      {toolId === 'prompt-improver' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Prompt Enhancer</h3>
          <div className="flex flex-col gap-2">
            <span className="text-xxs text-slate-400 font-bold uppercase">Rough Prompt Idea</span>
            <input 
              type="text" 
              value={rawPrompt}
              onChange={(e) => setRawPrompt(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none"
            />
          </div>

          <button 
            onClick={handleEnhancePrompt}
            disabled={isLoading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Sparkles size={13} /> {isLoading ? 'Structuring Prompt Layers...' : 'Enhance Prompt'}
          </button>

          {enhancedPrompt && (
            <div className="relative">
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 whitespace-pre-wrap leading-relaxed min-h-[120px]">
                {enhancedPrompt}
              </pre>
              <button 
                onClick={() => copyToClipboard(enhancedPrompt, 'prompt')}
                className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 border border-slate-850 text-slate-450 hover:text-white rounded"
              >
                {copiedId === 'prompt' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. EMAIL ASSISTANT */}
      {toolId === 'email-assistant' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Email Assistant</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xxs text-slate-400 font-bold uppercase block mb-1">Topic / Message Goal</label>
              <input 
                type="text" 
                value={emailTopic}
                onChange={(e) => setEmailTopic(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xxs text-slate-400 font-bold uppercase block mb-1">Tone style</label>
              <select 
                value={emailTone} 
                onChange={(e) => setEmailTone(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
              >
                <option value="Professional">Professional</option>
                <option value="Casual">Casual</option>
                <option value="Apologetic">Apologetic</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleDraftEmail}
            disabled={isLoading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold"
          >
            {isLoading ? 'Composing Brief...' : 'Draft Response Email'}
          </button>

          {emailDraft && (
            <div className="relative">
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-350 whitespace-pre-wrap leading-relaxed min-h-[140px]">
                {emailDraft}
              </pre>
              <button 
                onClick={() => copyToClipboard(emailDraft, 'email')}
                className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 border border-slate-800 text-slate-450 hover:text-white rounded"
              >
                {copiedId === 'email' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. OFFLINE TRANSLATOR */}
      {toolId === 'word-translator' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Multi-language Translator</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-xxs text-slate-400 font-bold uppercase block mb-1">Sentence to Translate</label>
              <input 
                type="text" 
                value={translateText}
                onChange={(e) => setTranslateText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xxs text-slate-400 font-bold uppercase block mb-1">Target Language</label>
              <select 
                value={translateTarget} 
                onChange={(e) => setTranslateTarget(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs focus:outline-none"
              >
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleTranslateText}
            disabled={isLoading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold"
          >
            {isLoading ? 'Translating Text...' : 'Translate Output'}
          </button>

          {translationResult && (
            <div className="relative">
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 whitespace-pre-wrap leading-relaxed min-h-[80px]">
                {translationResult}
              </pre>
              <button 
                onClick={() => copyToClipboard(translationResult, 'trans')}
                className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 border border-slate-800 text-slate-450 hover:text-white rounded"
              >
                {copiedId === 'trans' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
