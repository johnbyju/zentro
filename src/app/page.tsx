'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Cpu, 
  Layers, 
  Lock, 
  Play, 
  ArrowRight, 
  Sparkles, 
  Wrench, 
  Database,
  ShieldCheck,
  Zap,
  Code2,
  ChevronRight,
  MonitorPlay,
  Terminal,
  CpuIcon,
  Brain
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070914] text-slate-200 font-sans selection:bg-[#3D5CFF]/30 selection:text-white relative overflow-hidden">
      
      {/* Visual background ambient glow spots */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#3D5CFF]/8 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse duration-[8000ms]"></div>
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#6DD3FF]/6 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-10 left-10 w-[700px] h-[700px] bg-purple-950/8 rounded-full blur-[160px] pointer-events-none -z-10"></div>

      {/* Header bar */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-white/[0.04] backdrop-blur-md sticky top-0 z-50 bg-[#070914]/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#3D5CFF] to-[#6DD3FF] text-white shadow-[0_0_20px_rgba(61,92,255,0.3)]">
            <CpuIcon size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white uppercase leading-none">Zentro</h1>
            <p className="text-[9px] text-[#6DD3FF] font-bold tracking-widest uppercase mt-1">ON-DEVICE AI CREATOR</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
          <Link href="/assistant" className="text-[#6DD3FF] hover:text-white transition-colors duration-200 flex items-center gap-1.5"><Brain size={12} /> AI Assistant</Link>
          <a href="#features" className="hover:text-white transition-colors duration-200">Engine Features</a>
          <a href="#pipeline" className="hover:text-white transition-colors duration-200">5-Pass Pipeline</a>
          <a href="#toolbox" className="hover:text-white transition-colors duration-200">Offline Tools</a>
          <a href="#comparison" className="hover:text-white transition-colors duration-200">Local vs Cloud</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link 
            href="/assistant"
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors duration-200"
          >
            Chat Assistant
          </Link>
          <Link 
            href="/workspace"
            className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#3D5CFF] to-[#6DD3FF] hover:brightness-110 text-white rounded-xl text-xs font-bold transition-all shadow-[0_4px_25px_rgba(61,92,255,0.25)] active:scale-98"
          >
            Launch Studio <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center flex flex-col items-center relative z-10">
        
        {/* Glow Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0b0c18] border border-white/[0.06] hover:border-[#3D5CFF]/30 text-slate-300 text-xs font-semibold mb-8 tracking-wide shadow-[0_0_15px_rgba(61,92,255,0.05)] transition-colors">
          <Zap size={13} className="text-[#6DD3FF] fill-[#6DD3FF] animate-pulse" />
          <span className="text-slate-300 font-medium">100% Client-Side WebGPU Code Generator</span>
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl leading-[1.08] mb-8">
          The Future of AI Code-Building <br />
          <span className="bg-gradient-to-r from-[#3D5CFF] via-[#6DD3FF] to-[#a5f3fc] bg-clip-text text-transparent">
            Executes Inside Your Browser
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed mb-12">
          Compile and run full-stack web applications locally with WebGPU LLMs. Zero server requirements, complete data privacy, and a preloaded suite of developer utilities.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full sm:w-auto">
          <Link 
            href="/workspace"
            className="group flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-[#3D5CFF] to-[#6DD3FF] hover:brightness-110 text-white rounded-xl text-sm font-bold tracking-wide shadow-[0_4px_30px_rgba(61,92,255,0.35)] transition-all active:scale-98"
          >
            Start Vibe-Coding <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link 
            href="/assistant"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-[#0b0c18]/80 border border-white/[0.08] hover:border-[#3D5CFF]/30 hover:bg-[#0b0c18] text-slate-300 hover:text-white rounded-xl text-sm font-bold transition-all duration-200"
          >
            Open Chat Assistant
          </Link>
        </div>

        {/* Visual Workspace Mockup */}
        <div className="w-full max-w-5xl rounded-2xl border border-white/[0.06] bg-[#0b0c18]/90 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl relative overflow-hidden group">
          
          {/* Subtle accent border glow */}
          <div className="absolute -inset-px bg-gradient-to-r from-[#3D5CFF]/20 to-[#6DD3FF]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-2xl"></div>
          
          {/* Mock Window Header */}
          <div className="flex items-center justify-between px-3 pb-3.5 border-b border-white/[0.04] select-none">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-1 rounded-md bg-[#070914] border border-white/[0.04] text-[10px] text-slate-500 font-mono">
              <Lock size={10} className="text-[#3D5CFF]" />
              <span>zentro.local/workspace</span>
            </div>
            <div className="w-12"></div>
          </div>

          {/* Simulated Workspace Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[340px] font-mono text-left bg-[#070914]/40 rounded-xl overflow-hidden mt-4 border border-white/[0.04]">
            
            {/* Column 1: Pipeline Logs */}
            <div className="border-r border-white/[0.04] p-5 text-xs text-slate-500 flex flex-col gap-3.5 bg-[#0b0c18]/30">
              <span className="text-[10px] text-[#3D5CFF] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3D5CFF]"></span>
                5-Pass Generation Engine
              </span>
              <div className="flex items-center gap-2.5 text-emerald-400 bg-emerald-950/20 px-2.5 py-1.5 rounded-md border border-emerald-500/10">
                <ShieldCheck size={13} />
                <span>Pass 1: User Prompt Parsed</span>
              </div>
              <div className="flex items-center gap-2.5 text-emerald-400 bg-emerald-950/20 px-2.5 py-1.5 rounded-md border border-emerald-500/10">
                <ShieldCheck size={13} />
                <span>Pass 2: DOM Architecture Defined</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#6DD3FF] bg-[#3D5CFF]/10 px-2.5 py-1.5 rounded-md border border-[#3D5CFF]/20 animate-pulse">
                <Sparkles size={13} className="animate-spin duration-3000" />
                <span>Pass 3: Compiling Scripts & Styles</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600 px-2.5 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                <span>Pass 4: Integrity Tag Audit</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600 px-2.5 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                <span>Pass 5: CSS Visual Polish</span>
              </div>
            </div>

            {/* Column 2: Code Editor */}
            <div className="border-r border-white/[0.04] p-5 text-xs text-slate-400 flex flex-col gap-2 bg-[#0b0c18]/20">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-2 mb-2">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">script.js</span>
                <span className="text-[10px] text-slate-500">Javascript</span>
              </div>
              <span className="text-[#3D5CFF]">// Initialize local application sandbox</span>
              <span className="text-[#6DD3FF]">const <span className="text-white">canvas</span> = document.getElementById(<span className="text-emerald-400">'game'</span>);</span>
              <span className="text-purple-400">const <span className="text-white">ctx</span> = canvas.getContext(<span className="text-emerald-400">'2d'</span>);</span>
              <span className="text-slate-500">let score = 0;</span>
              <span className="text-slate-500">let snake = [&#123;x: 10, y: 10&#125;];</span>
              <span className="text-[#6DD3FF] font-semibold">function <span className="text-white">updateState</span>() &#123;</span>
              <span className="pl-4 text-slate-300">moveSnake();</span>
              <span className="pl-4 text-slate-300">checkCollisions();</span>
              <span className="pl-4 text-[#3D5CFF]">localStorage.setItem(<span className="text-emerald-400">'hi_score'</span>, score);</span>
              <span>&#125;</span>
            </div>

            {/* Column 3: Live Preview */}
            <div className="p-5 flex flex-col justify-center items-center text-center bg-[#070914]/80">
              <div className="flex flex-col items-center gap-3.5 max-w-[200px]">
                <div className="w-12 h-12 rounded-full bg-[#3D5CFF]/10 flex items-center justify-center text-[#3D5CFF] shadow-[0_0_20px_rgba(61,92,255,0.15)]">
                  <MonitorPlay size={22} className="text-[#6DD3FF]" />
                </div>
                <span className="text-xs font-semibold text-white">Live Sandbox Preview</span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Namespace isolated storage. Changes auto-inject and load inside client sandboxed frame.
                </p>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* Feature Grid Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/[0.04] relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">On-Device AI Engine Architecture</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Eliminate subscriptions, backend latency, and privacy leakage. Zentro encapsulates full generative capabilities within a browser-native stack.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: <Cpu size={22} className="text-[#3D5CFF]" />,
              title: "Client WebGPU Runtime",
              desc: "Downloads weights once and runs locally via WebGPU/WASM in a background worker. Zero setups or Ollama installations required."
            },
            {
              icon: <Layers size={22} className="text-[#6DD3FF]" />,
              title: "5-Pass Refining Pipeline",
              desc: "Achieves advanced code accuracy using sequential loops: Prompt Parse, Architecture, Code Build, Integrity Audit, and Styling."
            },
            {
              icon: <Database size={22} className="text-purple-400" />,
              title: "Isolated Local Storage",
              desc: "Intercepts standard persistence APIs. All generated apps persist state locally under independent sandboxed namespaces."
            },
            {
              icon: <Wrench size={22} className="text-pink-400" />,
              title: "62+ AI Utility Toolbox",
              desc: "Embedded offline workspace helpers including regular expression sandboxes, JSON formatters, SQL parsers, and API clients."
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-xl border border-white/[0.04] bg-[#0b0c18] hover:border-[#3D5CFF]/30 transition-all duration-300 flex flex-col gap-4 group hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(61,92,255,0.08)]"
            >
              <div className="w-11 h-11 rounded-xl bg-[#070914] flex items-center justify-center group-hover:scale-105 transition-transform border border-white/[0.04]">
                {item.icon}
              </div>
              <h4 className="text-sm font-bold text-white tracking-wide">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

      </section>

      {/* 5-Pass Pipeline Workflow */}
      <section id="pipeline" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/[0.04]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3D5CFF]/10 border border-[#3D5CFF]/20 text-[#6DD3FF] text-[10px] font-bold uppercase tracking-wider">
              Autonomous Code Synthesis
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              A 5-Pass Pipeline <br />Built for Small LLMs
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Standard local models can struggle with single-shot code outputs. Zentro resolves this constraints by passing your prompt through a multi-pass pipeline loop before compilation:
            </p>
            
            <div className="flex flex-col gap-4 font-mono text-xs text-slate-400 mt-2">
              {[
                { step: "1", title: "Prompt Analysis", detail: "Extracts custom features, requirements, and design constraints." },
                { step: "2", title: "DOM Blueprinting", detail: "Maps layout hierarchies, sections, and script libraries." },
                { step: "3", title: "Code Synthesis", detail: "Writes and encapsulates modular HTML, custom CSS variables, and JS logic." },
                { step: "4", title: "Integrity Audit", detail: "Inspects DOM tag balance, brackets, and scope boundaries." },
                { step: "5", title: "UX Styling", detail: "Applies layout responsiveness, neon glassmorphism gradients, and interactive hover properties." }
              ].map((p, idx) => (
                <div key={idx} className="flex gap-4 items-start bg-[#0b0c18]/40 p-3 rounded-lg border border-white/[0.02]">
                  <span className="w-6 h-6 rounded-md bg-[#3D5CFF]/15 text-[#6DD3FF] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-[#3D5CFF]/20">
                    {p.step}
                  </span>
                  <div>
                    <strong className="text-slate-200 block text-[11px] mb-0.5">{p.title}</strong>
                    <span className="text-[11px] leading-relaxed text-slate-400">{p.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-2xl border border-white/[0.04] bg-[#0b0c18] flex flex-col gap-6 relative overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#3D5CFF]/5 rounded-full blur-3xl pointer-events-none"></div>
            <h4 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <Terminal size={15} className="text-[#6DD3FF]" />
              Isolated Client-Sandbox API
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              When projects build, Zentro overrides system storage inside the sandbox container. Your local cookies or main database stays untouched:
            </p>
            <div className="p-4 bg-[#070914] rounded-xl border border-white/[0.04] font-mono text-[11px] text-[#6DD3FF] leading-relaxed flex flex-col gap-1 shadow-inner">
              <span className="text-slate-600">// Sandbox persistence binding</span>
              <span>const scope = "vibe-sandbox-todo-app-";</span>
              <span>localStorage.setItem = (key, val) =&gt; &#123;</span>
              <span className="pl-4 text-purple-400">parent.setItem(scope + key, val);</span>
              <span>&#125;;</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This isolates local storage namespaces, meaning games keep high scores and database apps keep items without overriding data from other generated tools.
            </p>
          </div>

        </div>
      </section>

      {/* Offline Toolbox Section */}
      <section id="toolbox" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/[0.04]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex w-fit items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-[10px] font-bold uppercase tracking-wider mb-6">
            <Wrench size={12} /> 62+ Offline Developer Utilities
          </div>
          <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
            Every Tool You Need — <span className="bg-gradient-to-r from-pink-400 to-[#6DD3FF] bg-clip-text text-transparent">Offline Ready</span>
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            A preloaded suite of developer utilities that run entirely in your browser. No sign-in, no rate limits, no server calls.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: <Code2 size={18} className="text-[#6DD3FF]" />, tag: "Code", title: "JSON Formatter & Validator", desc: "Beautify, minify, and validate JSON payloads. Highlights syntax errors inline." },
            { icon: <Terminal size={18} className="text-emerald-400" />, tag: "Regex", title: "Regex Sandbox", desc: "Live regex pattern tester with match highlighting, group extraction, and flag controls." },
            { icon: <Database size={18} className="text-purple-400" />, tag: "SQL", title: "SQL Query Builder", desc: "Write and preview SQL queries offline with a built-in schema visualizer." },
            { icon: <ShieldCheck size={18} className="text-amber-400" />, tag: "Security", title: "Base64 Encoder / Decoder", desc: "Encode and decode Base64 strings instantly — supports text and binary input." },
            { icon: <Zap size={18} className="text-[#3D5CFF]" />, tag: "Performance", title: "API Request Tester", desc: "Fire REST API calls (GET/POST/PUT/DELETE) directly from your browser with full header control." },
            { icon: <Layers size={18} className="text-pink-400" />, tag: "Data", title: "CSV ↔ JSON Converter", desc: "Paste or upload CSV data and convert it to JSON instantly, and vice versa." },
            { icon: <CpuIcon size={18} className="text-[#6DD3FF]" />, tag: "AI", title: "Text Summarizer", desc: "Use the on-device LLM to summarize long text blocks without sending data to any server." },
            { icon: <Brain size={18} className="text-emerald-400" />, tag: "AI", title: "Prompt Improver", desc: "Feed a rough prompt and get an optimized, detailed version for better AI output quality." },
            { icon: <Lock size={18} className="text-red-400" />, tag: "Security", title: "Hash Generator", desc: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes for any string or file — fully offline." },
            { icon: <Wrench size={18} className="text-amber-400" />, tag: "Format", title: "Color Picker & Converter", desc: "Convert between HEX, RGB, HSL, and HSV color spaces with live preview swatches." },
            { icon: <MonitorPlay size={18} className="text-[#3D5CFF]" />, tag: "Preview", title: "HTML Live Preview", desc: "Write raw HTML/CSS/JS and preview it instantly inside an isolated sandbox frame." },
            { icon: <Play size={18} className="text-pink-400" />, tag: "JS", title: "JavaScript REPL", desc: "Execute JavaScript snippets in an isolated environment with a live console output." },
          ].map((tool, idx) => (
            <div
              key={idx}
              className="group p-5 rounded-xl border border-white/[0.04] bg-[#0b0c18] hover:border-[#3D5CFF]/25 transition-all duration-300 flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(61,92,255,0.07)] cursor-default"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#070914] flex items-center justify-center border border-white/[0.04] group-hover:scale-105 transition-transform">
                  {tool.icon}
                </div>
                <span className="text-[9px] font-bold text-slate-500 bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {tool.tag}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1 tracking-wide">{tool.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{tool.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/toolbox"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0b0c18] border border-white/[0.06] hover:border-[#3D5CFF]/30 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
          >
            <Wrench size={13} className="text-pink-400" />
            Open Full Toolbox
            <ArrowRight size={13} className="text-[#6DD3FF]" />
          </Link>
          <p className="text-[10px] text-slate-600 mt-3">All tools run offline in your browser. No server required.</p>
        </div>
      </section>

      {/* Comparison table */}
      <section id="comparison" className="max-w-7xl mx-auto px-6 py-24 border-t border-white/[0.04]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Comparing AI Architectures</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            See how Zentro is engineered compared to legacy cloud systems and local CLI toolchains.
          </p>
        </div>

        <div className="w-full overflow-x-auto rounded-xl border border-white/[0.04] bg-[#0b0c18] shadow-[0_10px_35px_rgba(0,0,0,0.3)]">
          <table className="w-full border-collapse text-left text-xs text-slate-300">
            <thead>
              <tr className="border-b border-white/[0.04] bg-[#070914]/60 font-semibold text-white">
                <th className="p-5">Engineering Attribute</th>
                <th className="p-5 text-[#6DD3FF] bg-[#3D5CFF]/5">Zentro (Local App)</th>
                <th className="p-5">Cloud IDEs (Cursor/v0)</th>
                <th className="p-5">Local CLI (Ollama)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              <tr>
                <td className="p-5 font-bold text-slate-200">Processing Node</td>
                <td className="p-5 text-[#6DD3FF] bg-[#3D5CFF]/5 font-medium">In-Tab (GPU/WASM)</td>
                <td className="p-5 text-slate-400">Remote Servers</td>
                <td className="p-5 text-slate-400">Local Daemon Binary</td>
              </tr>
              <tr>
                <td className="p-5 font-bold text-slate-200">Zero Setup Requirement</td>
                <td className="p-5 text-[#6DD3FF] bg-[#3D5CFF]/5 font-medium">✅ Yes (No installs)</td>
                <td className="p-5 text-slate-400">✅ Yes (Uses Cloud)</td>
                <td className="p-5 text-slate-400">❌ No (CLI/Docker setup)</td>
              </tr>
              <tr>
                <td className="p-5 font-bold text-slate-200">True Offline Synthesis</td>
                <td className="p-5 text-[#6DD3FF] bg-[#3D5CFF]/5 font-medium">✅ Yes (Fully Cached)</td>
                <td className="p-5 text-slate-400">❌ No (Cloud only)</td>
                <td className="p-5 text-[#6DD3FF] bg-[#3D5CFF]/5 font-medium">✅ Yes</td>
              </tr>
              <tr>
                <td className="p-5 font-bold text-slate-200">Zero Data Footprint</td>
                <td className="p-5 text-[#6DD3FF] bg-[#3D5CFF]/5 font-medium">✅ Complete Privacy</td>
                <td className="p-5 text-slate-400">❌ Code sent to cloud</td>
                <td className="p-5 text-[#6DD3FF] bg-[#3D5CFF]/5 font-medium">✅ Complete Privacy</td>
              </tr>
              <tr>
                <td className="p-5 font-bold text-slate-200">Integrated Sandboxing</td>
                <td className="p-5 text-[#6DD3FF] bg-[#3D5CFF]/5 font-medium">✅ Yes (In-tab Iframe)</td>
                <td className="p-5 text-slate-400">✅ Yes (Virtual container)</td>
                <td className="p-5 text-slate-400">❌ No (Terminal outputs only)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 relative z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#3D5CFF]" />
          <span>Zentro Studio — Local-First, Browser-Based AI Engine</span>
        </div>
        <p className="text-slate-600">&copy; {new Date().getFullYear()} Vibesterz. Open Source Local-First Playground.</p>
      </footer>

    </div>
  );
}
