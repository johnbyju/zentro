'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Cpu, FileUp, Play, CheckCircle, Terminal, RefreshCw } from 'lucide-react';

interface SliderConfig {
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
}

interface DropdownConfig {
  label: string;
  options: string[];
  defaultValue: string;
}

interface AiToolConfig {
  id: string;
  name: string;
  description: string;
  inputFileType: 'image' | 'audio' | 'pdf' | 'text' | 'any';
  sliders?: SliderConfig[];
  dropdowns?: DropdownConfig[];
  steps: string[];
  successMessage: string;
  mockResultType: 'image_bg_remove' | 'image_upscale' | 'object_detect' | 'audio_transcript' | 'document_qa' | 'deck_presentation';
}

interface AiSimulationConsoleProps {
  config: AiToolConfig;
}

export default function AiSimulationConsole({ config }: AiSimulationConsoleProps) {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Dynamic settings state
  const [sliderVals, setSliderVals] = useState<Record<string, number>>({});
  const [dropdownVals, setDropdownVals] = useState<Record<string, string>>({});

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset state on config change
    setFile(null);
    setFilePreview(null);
    setIsRunning(false);
    setProgress(0);
    setConsoleLogs([]);
    setCurrentStepIndex(0);
    setIsCompleted(false);

    // Initialize default values
    const sVals: Record<string, number> = {};
    config.sliders?.forEach(s => { sVals[s.label] = s.defaultValue; });
    setSliderVals(sVals);

    const dVals: Record<string, string> = {};
    config.dropdowns?.forEach(d => { dVals[d.label] = d.defaultValue; });
    setDropdownVals(dVals);
  }, [config]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
      setIsCompleted(false);
      setProgress(0);
      setConsoleLogs([]);
    }
  };

  const startSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setIsCompleted(false);
    setProgress(0);
    setCurrentStepIndex(0);
    setConsoleLogs([
      `[GPU] Querying physical device adapter info...`,
      `[GPU] WebGPU Adapter: Apple M-Series (Integrated TPU/GPU Cluster)`,
      `[GPU] Preferred texture format: bgra8unorm`,
      `[Kernel] Initializing offline tensor compiler pipeline...`
    ]);

    let stepIdx = 0;
    const totalSteps = config.steps.length;

    const interval = setInterval(() => {
      if (stepIdx < totalSteps) {
        const nextStep = config.steps[stepIdx];
        const randomGpuMetric = `[WebGPU Device] Temp: 42°C | VRAM Alloc: ${(128 + Math.random() * 256).toFixed(1)}MB | GFLOPS: ${(800 + Math.random() * 400).toFixed(0)}`;
        setConsoleLogs(prev => [
          ...prev, 
          `[Compilation] ${nextStep}`,
          randomGpuMetric
        ]);
        setCurrentStepIndex(stepIdx);
        setProgress(Math.round(((stepIdx + 1) / totalSteps) * 100));
        stepIdx++;
      } else {
        clearInterval(interval);
        setConsoleLogs(prev => [
          ...prev,
          `[Process] Finalizing tensor layers execution...`,
          `[Process] Output cache written successfully.`,
          `[System] Process execution complete offline. 0 bytes uploaded to external servers.`
        ]);
        setIsRunning(false);
        setIsCompleted(true);
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-6 text-slate-100">
      {/* Description header */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20 text-pink-400">
            <Cpu size={14} />
          </div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">{config.name}</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{config.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left pane: Upload + Controls */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-slate-900/40 border border-slate-800 rounded-xl p-5">
          {/* File Upload Dropzone */}
          <div className="flex flex-col gap-2">
            <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Input File</span>
            <div className="relative group border border-dashed border-slate-800 hover:border-indigo-500/40 bg-slate-950/40 rounded-xl p-6 transition-all text-center flex flex-col items-center justify-center gap-3 min-h-[140px] cursor-pointer">
              <input 
                type="file"
                accept={
                  config.inputFileType === 'image' ? 'image/*' :
                  config.inputFileType === 'audio' ? 'audio/*' :
                  config.inputFileType === 'pdf' ? 'application/pdf' :
                  config.inputFileType === 'text' ? '.txt,.md,.json,.js' : '*/*'
                }
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileUp size={28} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-slate-300">
                  {file ? file.name : `Drag & drop your ${config.inputFileType}`}
                </p>
                <p className="text-[10px] text-slate-500">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Processes locally in sandbox'}
                </p>
              </div>
            </div>
          </div>

          {/* Configuration Parameters */}
          {(config.sliders || config.dropdowns) && (
            <div className="flex flex-col gap-4 border-t border-slate-800/60 pt-4">
              <span className="text-xxs uppercase tracking-wider text-slate-400 font-bold">Model Dials</span>
              
              {config.dropdowns?.map(d => (
                <div key={d.label} className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-300 font-medium">{d.label}</label>
                  <select 
                    value={dropdownVals[d.label] || ''}
                    onChange={(e) => setDropdownVals({ ...dropdownVals, [d.label]: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {d.options.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              ))}

              {config.sliders?.map(s => (
                <div key={s.label} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">{s.label}</span>
                    <span className="text-indigo-400 font-mono">
                      {sliderVals[s.label] || s.defaultValue}{s.unit || ''}
                    </span>
                  </div>
                  <input 
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={sliderVals[s.label] !== undefined ? sliderVals[s.label] : s.defaultValue}
                    onChange={(e) => setSliderVals({ ...sliderVals, [s.label]: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Trigger Button */}
          <button
            onClick={startSimulation}
            disabled={!file || isRunning}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md ${
              !file 
                ? 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed'
                : isRunning
                ? 'bg-indigo-900/30 text-indigo-400 border border-indigo-700/30 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500/40'
            }`}
          >
            {isRunning ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Play size={14} />
            )}
            {isRunning ? 'Processing on Device VRAM...' : 'Run Local Model'}
          </button>
        </div>

        {/* Right pane: Console log + Result container */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* WebGPU logs output terminal */}
          <div className="flex flex-col gap-2 bg-[#050811] border border-slate-800/80 rounded-xl p-4 font-mono">
            <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-800/60 pb-2">
              <span className="flex items-center gap-1.5 font-bold uppercase"><Terminal size={11} /> Sandbox WebGPU Console</span>
              <span className="text-[9px] font-bold text-[#6DD3FF] bg-[#6DD3FF]/5 px-2 py-0.5 border border-[#6DD3FF]/10 rounded uppercase">Offline</span>
            </div>
            
            <div className="h-[120px] overflow-y-auto flex flex-col gap-1 text-[11px] leading-relaxed text-slate-400 custom-scrollbar pr-2 pt-1">
              {consoleLogs.map((log, idx) => (
                <div key={idx} className={
                  log.startsWith('[GPU]') ? 'text-indigo-400' :
                  log.startsWith('[Compilation]') ? 'text-emerald-400/90 font-semibold' :
                  log.startsWith('[System]') ? 'text-pink-400 font-bold' : 'text-slate-400'
                }>
                  {log}
                </div>
              ))}
              {isRunning && (
                <div className="flex items-center gap-1.5 text-indigo-400 text-xxs animate-pulse">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full"></span> Compiler running inference loops...
                </div>
              )}
              {consoleLogs.length === 0 && (
                <span className="text-slate-600 italic">Load a file and click "Run Local Model" to activate compiling pipeline.</span>
              )}
              <div ref={terminalEndRef} />
            </div>

            {isRunning && (
              <div className="flex flex-col gap-1 border-t border-slate-850 pt-2.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>Executing Shader Matrix Passes</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Output Visual Area */}
          <div className="flex-1 bg-slate-900/20 border border-slate-800/60 rounded-xl p-5 min-h-[200px] flex flex-col justify-center items-center">
            {isCompleted ? (
              <div className="w-full flex flex-col items-center gap-4 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 animate-bounce">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Inference Completed</h4>
                  <p className="text-xs text-slate-400">{config.successMessage}</p>
                </div>

                {/* Render mock results based on type */}
                {config.mockResultType === 'image_bg_remove' && filePreview && (
                  <div className="relative border border-slate-800 rounded-xl overflow-hidden max-h-[220px] bg-checkerboard w-full max-w-[280px]">
                    <img 
                      src={filePreview} 
                      alt="Output preview"
                      className="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] brightness-105"
                      style={{ maskImage: 'linear-gradient(to bottom, black 90%, transparent)' }}
                    />
                    <div className="absolute inset-0 bg-[#3d5cff]/5 pointer-events-none"></div>
                  </div>
                )}

                {config.mockResultType === 'image_upscale' && filePreview && (
                  <div className="flex gap-4 items-center justify-center w-full max-w-md">
                    <div className="flex flex-col gap-1 w-1/2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Original (1x)</span>
                      <div className="border border-slate-800 rounded bg-slate-950 overflow-hidden h-32 flex items-center justify-center">
                        <img src={filePreview} className="max-h-full max-w-full object-contain blur-[1px]" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 w-1/2">
                      <span className="text-[10px] text-indigo-400 font-bold uppercase">Upscaled (4x HD)</span>
                      <div className="border border-indigo-900/40 rounded bg-slate-950 overflow-hidden h-32 flex items-center justify-center relative shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                        <img src={filePreview} className="max-h-full max-w-full object-contain brightness-105 contrast-105" />
                        <div className="absolute top-1 right-1 bg-indigo-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">4K ULTRA</div>
                      </div>
                    </div>
                  </div>
                )}

                {config.mockResultType === 'object_detect' && filePreview && (
                  <div className="relative border border-slate-800 rounded-xl overflow-hidden max-h-[220px] w-full max-w-[280px]">
                    <img src={filePreview} className="w-full h-full object-contain" />
                    {/* Bounding boxes overlays */}
                    <div className="absolute top-[20%] left-[15%] w-[45%] h-[55%] border-2 border-emerald-400 bg-emerald-400/10 pointer-events-none rounded">
                      <span className="absolute -top-5 left-0 bg-emerald-500 text-black text-[8px] font-black px-1 rounded uppercase">Subject (98.6%)</span>
                    </div>
                    <div className="absolute top-[35%] left-[65%] w-[25%] h-[30%] border-2 border-indigo-400 bg-indigo-400/10 pointer-events-none rounded">
                      <span className="absolute -top-5 left-0 bg-indigo-500 text-white text-[8px] font-black px-1 rounded uppercase">Object (84.1%)</span>
                    </div>
                  </div>
                )}

                {config.mockResultType === 'audio_transcript' && (
                  <div className="w-full max-w-md bg-slate-950 border border-slate-850 p-4 rounded-xl text-left font-mono">
                    <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mb-2 flex justify-between">
                      <span>Transcript Output</span>
                      <span>Confidence: 99.4%</span>
                    </p>
                    <div className="text-xs text-slate-300 leading-relaxed h-[100px] overflow-y-auto pr-2">
                      <p className="mb-2"><span className="text-slate-500">[00:02 - 00:08] Speaker 1:</span> "Alright, thanks for joining the developer standup. Let's look at the local AI compiler tasks."</p>
                      <p className="mb-2"><span className="text-slate-500">[00:09 - 00:15] Speaker 2:</span> "Yes, I loaded the model weights. The WebGPU pipeline is compiled and runs offline."</p>
                      <p><span className="text-slate-500">[00:16 - 00:22] Speaker 1:</span> "Great. That ensures high performance and complete data privacy for users."</p>
                    </div>
                  </div>
                )}

                {config.mockResultType === 'document_qa' && (
                  <div className="w-full max-w-md bg-slate-950 border border-slate-850 p-4 rounded-xl text-left">
                    <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold mb-2">Semantic Extraction Summary</p>
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                        <span className="font-semibold text-slate-300 block mb-1">Key Entities Detected:</span>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-850 rounded text-slate-400">Zentro Framework</span>
                          <span className="px-1.5 py-0.5 bg-slate-850 rounded text-slate-400">WebGPU Kernel</span>
                          <span className="px-1.5 py-0.5 bg-slate-850 rounded text-slate-400">Model Weights</span>
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                        <span className="font-semibold text-slate-300 block mb-1">Summary Paragraph:</span>
                        <p className="text-slate-400 leading-relaxed font-sans">The document outlines the engineering implementation plan for browser-based offline AI. Focus areas include shader allocation, local index querying, and WASM assembly interfaces.</p>
                      </div>
                    </div>
                  </div>
                )}

                {config.mockResultType === 'deck_presentation' && (
                  <div className="w-full max-w-md bg-slate-950 border border-slate-850 p-4 rounded-xl text-left font-mono">
                    <p className="text-[10px] text-pink-400 uppercase tracking-widest font-bold mb-2">Presentation Outline Generated</p>
                    <div className="flex flex-col gap-2 text-xs max-h-[140px] overflow-y-auto pr-2">
                      <div className="border-l-2 border-pink-500 pl-2">
                        <h5 className="font-bold text-slate-200">Slide 1: Title Slide</h5>
                        <p className="text-[10px] text-slate-500">Topic: Modern Desktop AI Workspaces</p>
                      </div>
                      <div className="border-l-2 border-indigo-500 pl-2">
                        <h5 className="font-bold text-slate-200">Slide 2: Architecture</h5>
                        <p className="text-[10px] text-slate-500">Core elements: WebGPU Kernels, IndexedDB, WASM</p>
                      </div>
                      <div className="border-l-2 border-indigo-500 pl-2">
                        <h5 className="font-bold text-slate-200">Slide 3: Client Benefits</h5>
                        <p className="text-[10px] text-slate-500">Zero latency, offline availability, total confidentiality</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center text-slate-500">
                <Cpu size={32} className="mx-auto text-slate-700 mb-3 animate-pulse" />
                <p className="text-xs">Visual output will render here once local compilation finishes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
