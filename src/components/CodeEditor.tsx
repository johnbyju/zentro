'use client';

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  FileCode, 
  Terminal, 
  Paintbrush, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  ChevronDown
} from 'lucide-react';

interface CodeEditorProps {
  html: string;
  css: string;
  js: string;
  onChange: (file: 'html' | 'css' | 'js', value: string) => void;
}

type Tab = 'html' | 'css' | 'js';

export default function CodeEditor({ html, css, js, onChange }: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('html');
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [minimapEnabled, setMinimapEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full bg-[#070b16] border border-slate-800 rounded-xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-400">Loading IDE Kernel...</span>
        </div>
      </div>
    );
  }

  const getLanguage = (tab: Tab) => {
    if (tab === 'js') return 'javascript';
    return tab; // html, css are valid Monaco languages
  };

  const getCode = (tab: Tab) => {
    if (tab === 'html') return html;
    if (tab === 'css') return css;
    return js;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(activeTab, value);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode(activeTab));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = getCode(activeTab);
    const filename = activeTab === 'html' ? 'index.html' : activeTab === 'css' ? 'style.css' : 'script.js';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm(`Are you sure you want to clear the content of ${activeTab === 'html' ? 'index.html' : activeTab === 'css' ? 'style.css' : 'script.js'}?`)) {
      onChange(activeTab, '');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#070b16] border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl transition-all duration-300">
      
      {/* ─── Premium Editor Header ─── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#090f1f] border-b border-slate-800/80 select-none">
        
        {/* Language Badge */}
        {activeTab === 'html' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 py-0.5 px-2 text-[9px] font-black tracking-wider rounded bg-gradient-to-r from-orange-600 to-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.25)] uppercase">
              <FileCode size={10} /> HTML5
            </div>
            <span className="text-xs font-bold text-slate-300">index.html</span>
          </div>
        )}
        {activeTab === 'css' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 py-0.5 px-2 text-[9px] font-black tracking-wider rounded bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.25)] uppercase">
              <Paintbrush size={10} /> CSS3
            </div>
            <span className="text-xs font-bold text-slate-300">style.css</span>
          </div>
        )}
        {activeTab === 'js' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 py-0.5 px-2 text-[9px] font-black tracking-wider rounded bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 shadow-[0_0_10px_rgba(245,158,11,0.25)] uppercase">
              <Terminal size={10} /> ES6+
            </div>
            <span className="text-xs font-bold text-slate-300">script.js</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Minimap Toggle */}
          <button 
            onClick={() => setMinimapEnabled(!minimapEnabled)}
            className={`p-1.5 rounded-lg border transition-all duration-200 ${
              minimapEnabled 
                ? 'bg-indigo-600/10 border-indigo-500/25 text-indigo-400' 
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
            }`}
            title={minimapEnabled ? "Hide Minimap" : "Show Minimap"}
          >
            {minimapEnabled ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          
          {/* Copy Code */}
          <button 
            onClick={handleCopy}
            className={`p-1.5 rounded-lg border flex items-center gap-1 transition-all duration-200 ${
              copied 
                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
            }`}
            title="Copy to Clipboard"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-[9px] font-bold">Copied!</span>
              </>
            ) : (
              <Copy size={13} />
            )}
          </button>

          {/* Download File */}
          <button 
            onClick={handleDownload}
            className="p-1.5 rounded-lg border border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-all duration-200"
            title="Download active file"
          >
            <Download size={13} />
          </button>

          {/* Divider */}
          <div className="w-px h-4 bg-slate-800/60 mx-1"></div>

          {/* Clear Code */}
          <button 
            onClick={handleClear}
            className="p-1.5 rounded-lg border border-transparent text-slate-500 hover:text-red-400 hover:bg-red-950/15 transition-all duration-200"
            title="Clear editor code"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* ─── Tabs & Live Indicator Panel ─── */}
      <div className="flex items-center justify-between bg-[#0b1022] border-b border-slate-800/60 select-none h-9 shrink-0">
        
        {/* Left tabs container */}
        <div className="flex items-center h-full">
          {/* File Explorer Toggle */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex items-center gap-1 px-3 h-full text-[10px] font-bold uppercase tracking-wider border-r border-slate-800/45 transition-colors ${
              isSidebarOpen ? 'text-indigo-400 bg-indigo-950/15' : 'text-slate-500 hover:bg-slate-900/40 hover:text-slate-300'
            }`}
            title={isSidebarOpen ? "Hide File List" : "Show File List"}
          >
            {isSidebarOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            Files
          </button>

          {/* index.html Tab */}
          <button 
            onClick={() => setActiveTab('html')}
            className={`flex items-center gap-2 px-4 h-full text-xxs font-bold tracking-wide border-r border-slate-800/45 transition-all ${
              activeTab === 'html' 
                ? 'bg-[#070b16] text-amber-400 border-t-2 border-t-amber-500/80 shadow-inner' 
                : 'text-slate-500 hover:bg-slate-900/40 hover:text-slate-350'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            index.html
          </button>

          {/* style.css Tab */}
          <button 
            onClick={() => setActiveTab('css')}
            className={`flex items-center gap-2 px-4 h-full text-xxs font-bold tracking-wide border-r border-slate-800/45 transition-all ${
              activeTab === 'css' 
                ? 'bg-[#070b16] text-blue-400 border-t-2 border-t-blue-500/80 shadow-inner' 
                : 'text-slate-500 hover:bg-slate-900/40 hover:text-slate-350'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            style.css
          </button>

          {/* script.js Tab */}
          <button 
            onClick={() => setActiveTab('js')}
            className={`flex items-center gap-2 px-4 h-full text-xxs font-bold tracking-wide border-r border-slate-800/45 transition-all ${
              activeTab === 'js' 
                ? 'bg-[#070b16] text-yellow-400 border-t-2 border-t-yellow-500/80 shadow-inner' 
                : 'text-slate-500 hover:bg-slate-900/40 hover:text-slate-350'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-450"></span>
            script.js
          </button>

          {/* Static Add Tab Button */}
          <button 
            className="px-3 h-full text-slate-600 hover:text-slate-400 cursor-not-allowed transition-colors" 
            title="Session files are fixed: HTML, CSS, JS"
            disabled
          >
            <span className="text-sm font-light">+</span>
          </button>
        </div>

        {/* Live sync connection dot */}
        <div className="flex items-center gap-1.5 px-4 h-full border-l border-slate-800/45">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]"></span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Live Sync</span>
        </div>

      </div>

      {/* ─── Editor Main Panel ─── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Collapsible File Explorer Sidebar */}
        {isSidebarOpen && (
          <aside className="w-48 bg-[#090d19] border-r border-slate-800/60 flex flex-col shrink-0 select-none py-3 transition-all duration-300">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-550">Files Sidebar</span>
              <div className="text-[8px] font-bold bg-slate-800/60 text-slate-400 px-1.5 py-0.5 rounded-md border border-slate-700/30">3 Files</div>
            </div>
            
            <div className="flex flex-col gap-1 px-1">
              {/* index.html entry */}
              <div 
                onClick={() => setActiveTab('html')}
                className={`flex items-center justify-between px-2.5 py-1.5 text-xxs font-bold rounded-md cursor-pointer transition-all ${
                  activeTab === 'html' 
                    ? 'bg-amber-950/15 border border-amber-900/30 text-amber-400 font-extrabold shadow-sm' 
                    : 'border border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCode size={12} className={activeTab === 'html' ? "text-amber-400" : "text-amber-550"} />
                  <span>index.html</span>
                </div>
                <span className={`text-[7px] font-bold uppercase px-1 rounded ${activeTab === 'html' ? 'bg-amber-400/10 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                  HTML
                </span>
              </div>

              {/* style.css entry */}
              <div 
                onClick={() => setActiveTab('css')}
                className={`flex items-center justify-between px-2.5 py-1.5 text-xxs font-bold rounded-md cursor-pointer transition-all ${
                  activeTab === 'css' 
                    ? 'bg-blue-950/15 border border-blue-900/30 text-blue-400 font-extrabold shadow-sm' 
                    : 'border border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Paintbrush size={12} className={activeTab === 'css' ? "text-blue-400" : "text-blue-550"} />
                  <span>style.css</span>
                </div>
                <span className={`text-[7px] font-bold uppercase px-1 rounded ${activeTab === 'css' ? 'bg-blue-400/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                  CSS
                </span>
              </div>

              {/* script.js entry */}
              <div 
                onClick={() => setActiveTab('js')}
                className={`flex items-center justify-between px-2.5 py-1.5 text-xxs font-bold rounded-md cursor-pointer transition-all ${
                  activeTab === 'js' 
                    ? 'bg-yellow-950/15 border border-yellow-900/30 text-yellow-450 font-extrabold shadow-sm' 
                    : 'border border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Terminal size={12} className={activeTab === 'js' ? "text-yellow-400" : "text-yellow-550"} />
                  <span>script.js</span>
                </div>
                <span className={`text-[7px] font-bold uppercase px-1 rounded ${activeTab === 'js' ? 'bg-yellow-400/10 text-yellow-450' : 'bg-slate-800 text-slate-500'}`}>
                  JS
                </span>
              </div>
            </div>
          </aside>
        )}

        {/* Monaco Editor Component */}
        <div className="flex-1 min-w-0 bg-[#070b16] relative h-full">
          <Editor
            height="100%"
            language={getLanguage(activeTab)}
            theme="vs-dark"
            value={getCode(activeTab)}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: minimapEnabled },
              fontSize: 13,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              padding: { top: 12, bottom: 12 },
              fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>

      </div>

    </div>
  );
}
