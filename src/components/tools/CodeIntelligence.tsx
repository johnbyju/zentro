'use client';

import React, { useState, useEffect } from 'react';
import { 
  Check, Copy, AlertCircle, Play, Cpu, Send, Code, Terminal, Sparkles
} from 'lucide-react';

interface CodeIntelligenceProps {
  toolId: string;
}

export default function CodeIntelligence({ toolId }: CodeIntelligenceProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to fetch keys and call local api/chat
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

  // --- 1. Regex Sandbox ---
  const [regexPattern, setRegexPattern] = useState('\\d+');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexTestText, setRegexTestText] = useState('Booking reference code is 94827, user ID is 302.');
  const [regexMatches, setRegexMatches] = useState<string[]>([]);
  const [regexError, setRegexError] = useState('');
  
  const testRegex = () => {
    setRegexError('');
    if (!regexPattern) return;
    try {
      const rx = new RegExp(regexPattern, regexFlags);
      const matches = regexTestText.match(rx);
      setRegexMatches(matches || []);
    } catch (e: any) {
      setRegexError(e.message || 'Invalid regular expression syntax.');
      setRegexMatches([]);
    }
  };
  useEffect(() => {
    if (toolId === 'regex-tester') {
      testRegex();
    }
  }, [regexPattern, regexFlags, regexTestText, toolId]);

  // --- 2. SQL Gen & Assistant ---
  const [sqlPrompt, setSqlPrompt] = useState('Retrieve all accounts signed up in 2026 with active status');
  const [sqlResult, setSqlResult] = useState('');
  const handleSqlGen = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await queryLocalAi(
        `Generate only the clean SQL query for: "${sqlPrompt}". Do not include markdown brackets, code blocks or talk. Just output the query.`,
        `You are a developer SQL generator database query optimizer.`
      );
      setSqlResult(result);
    } catch (e: any) {
      // Offline fallback
      const q = sqlPrompt.toLowerCase();
      let fallbackQuery = `SELECT * FROM accounts \nWHERE signup_date >= '2026-01-01' \n  AND status = 'active';`;
      if (q.includes('delete')) fallbackQuery = `DELETE FROM user_sessions WHERE expires_at < NOW();`;
      setSqlResult(fallbackQuery);
      setErrorMessage(e.message || 'Running offline query templates (no API keys configured).');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. Code Explainer ---
  const [codeToExplain, setCodeToExplain] = useState('async function load(url) {\n  const res = await fetch(url);\n  if (!res.ok) throw new Error("HTTP failed");\n  return res.json();\n}');
  const [codeExplanation, setCodeExplanation] = useState('');
  const handleCodeExplain = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await queryLocalAi(
        `Analyze and explain the following code blocks step-by-step:\n\n${codeToExplain}`,
        `You are an expert developer assistant detailing execution workflows and parameters.`
      );
      setCodeExplanation(result);
    } catch (e: any) {
      setCodeExplanation(`### Standard Local Explanation\n\n1. **Asynchronous fetching**: The function initiates a standard asynchronous fetch sequence on the provided \`url\` parameter.\n2. **Error handler validation**: It checks the response status \`res.ok\`. If negative, it triggers a throw catch sequence.\n3. **JSON Parsing**: Compiles stream data back to a readable JSON object.\n\n*(Note: configure API keys in Assistant header for full AI breakdowns).*`);
      setErrorMessage(e.message || 'Offline mode: loaded client-side fallback breakdown.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. Code Translator ---
  const [sourceLang, setSourceLang] = useState('JavaScript');
  const [targetLang, setTargetLang] = useState('Python');
  const [codeToTranslate, setCodeToTranslate] = useState('const square = (n) => n * n;\nconsole.log(square(9));');
  const [translatedCode, setTranslatedCode] = useState('');
  const handleTranslate = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await queryLocalAi(
        `Translate this code block from ${sourceLang} to ${targetLang}. Output only the translated code without any other description/conversation:\n\n${codeToTranslate}`,
        `You are a multilingual software translator compiler.`
      );
      setTranslatedCode(result);
    } catch (e: any) {
      let mockTrans = `def square(n):\n    return n * n\n\nprint(square(9))`;
      if (targetLang.toLowerCase() === 'go') mockTrans = `package main\nimport "fmt"\n\nfunc square(n int) int {\n    return n * n\n}\nfunc main() {\n    fmt.Println(square(9))\n}`;
      setTranslatedCode(mockTrans);
      setErrorMessage(e.message || 'Offline model: loaded matching translation templates.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 5. Unit Test Generator ---
  const [codeForTests, setCodeForTests] = useState('function calculatePercentage(value, total) {\n  if (total === 0) return 0;\n  return (value / total) * 100;\n}');
  const [generatedTests, setGeneratedTests] = useState('');
  const handleGenerateTests = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await queryLocalAi(
        `Generate comprehensive unit tests for this function in the standard framework (Jest/Pytest/etc.):\n\n${codeForTests}`,
        `You are a senior testing engineer generating clean test assertions.`
      );
      setGeneratedTests(result);
    } catch (e: any) {
      setGeneratedTests(`// Jest Test Suite (Generated Offline fallback)\ndescribe('calculatePercentage', () => {\n  test('correctly calculates percentage values', () => {\n    expect(calculatePercentage(50, 200)).toBe(25);\n  });\n  test('returns 0 if total is 0 to avoid Division by Zero', () => {\n    expect(calculatePercentage(10, 0)).toBe(0);\n  });\n});`);
      setErrorMessage(e.message || 'Offline framework: loaded mock Jest suites.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 6. Commit & PR Writer ---
  const [gitDiff, setGitDiff] = useState('diff --git a/src/components/Button.tsx b/src/components/Button.tsx\n- <button className="bg-blue-500">\n+ <button className="bg-indigo-600 hover:bg-indigo-700 shadow-md">');
  const [commitMessage, setCommitMessage] = useState('');
  const handleWriteCommit = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await queryLocalAi(
        `Based on this git diff, generate a semantic commit message and a brief PR bullet-point description. Do not write chat logs:\n\n${gitDiff}`,
        `You are a git master generating clean conventional commits.`
      );
      setCommitMessage(result);
    } catch (e: any) {
      setCommitMessage(`feat(components): enhance button visual style and contrast\n\n- Updated background color to indigo-600 for better contrast.\n- Added hover state (hover:bg-indigo-700) for interactive feedback.\n- Applied subtle shadow-md classes.`);
      setErrorMessage(e.message || 'Offline git assistant loaded conventional commit fallbacks.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col gap-5 text-slate-100">
      {/* Search warnings */}
      {errorMessage && (
        <div className="flex gap-2 p-3 bg-indigo-950/20 border border-indigo-800/30 rounded-lg text-indigo-300 text-xs">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. REGEX SANDBOX */}
      {toolId === 'regex-tester' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Regex Sandbox & Evaluator</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xxs text-slate-400 font-bold uppercase block mb-1">Regex Pattern</label>
              <input 
                type="text" 
                value={regexPattern}
                onChange={(e) => setRegexPattern(e.target.value)}
                placeholder="\d+"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xxs text-slate-400 font-bold uppercase block mb-1">Regex Flags</label>
              <input 
                type="text" 
                value={regexFlags}
                onChange={(e) => setRegexFlags(e.target.value)}
                placeholder="g, i, m"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xxs text-slate-400 font-bold uppercase">Test Text Sandbox</span>
            <textarea 
              value={regexTestText}
              onChange={(e) => setRegexTestText(e.target.value)}
              rows={4}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
            />
          </div>

          {regexError && (
            <div className="flex gap-2 p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg text-rose-450 text-xs">
              <AlertCircle size={16} />
              <span>{regexError}</span>
            </div>
          )}

          <div className="bg-slate-900/40 p-4 border border-slate-808 rounded-xl flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">Matches Detected ({regexMatches.length}):</span>
              {regexMatches.length > 0 && (
                <button 
                  onClick={() => copyToClipboard(JSON.stringify(regexMatches), 'rx')}
                  className="text-xxs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                >
                  <Copy size={11} /> Copy List
                </button>
              )}
            </div>
            {regexMatches.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {regexMatches.map((match, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-indigo-950/40 border border-indigo-850/50 rounded font-mono text-[10px] text-indigo-300">
                    {match}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">No matching structures found.</span>
            )}
          </div>
        </div>
      )}

      {/* 2. SQL GENERATOR & ASSISTANT */}
      {toolId === 'sql-query' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI SQL Assistant</h3>
          <div className="flex flex-col gap-2">
            <span className="text-xxs text-slate-400 font-bold uppercase">Natural Language Request</span>
            <textarea 
              value={sqlPrompt}
              onChange={(e) => setSqlPrompt(e.target.value)}
              rows={3}
              placeholder="e.g. Find all products priced under $50 ordered by status..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <button 
            onClick={handleSqlGen}
            disabled={isLoading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2"
          >
            <Sparkles size={13} /> {isLoading ? 'Optimizing Query...' : 'Generate SQL Statement'}
          </button>

          {sqlResult && (
            <div className="relative">
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 overflow-x-auto min-h-[100px]">
                {sqlResult}
              </pre>
              <button 
                onClick={() => copyToClipboard(sqlResult, 'sql')}
                className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 border border-slate-850 text-slate-450 hover:text-white rounded"
              >
                {copiedId === 'sql' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. CODE EXPLAINER */}
      {toolId === 'code-explainer' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Code Explainer & Analyst</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Code Input Editor</span>
              <textarea 
                value={codeToExplain}
                onChange={(e) => setCodeToExplain(e.target.value)}
                rows={12}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
              />
              <button 
                onClick={handleCodeExplain}
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2"
              >
                <Cpu size={13} /> {isLoading ? 'Analyzing Ast Trees...' : 'Analyze Code Execution'}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">AI Explanation Breakdown</span>
              <div className="flex-1 p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs leading-relaxed text-slate-350 overflow-y-auto whitespace-pre-wrap min-h-[220px]">
                {codeExplanation || <span className="text-slate-600 italic">Click analyze to review steps.</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CODE TRANSLATOR */}
      {toolId === 'code-translator' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Multilingual Code Translator</h3>
          <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-450 uppercase tracking-wide">
            <div>
              <span className="block mb-1">Source Language</span>
              <select 
                value={sourceLang} 
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded focus:outline-none"
              >
                <option value="JavaScript">JavaScript</option>
                <option value="Python">Python</option>
                <option value="TypeScript">TypeScript</option>
                <option value="Go">Go</option>
                <option value="C++">C++</option>
              </select>
            </div>
            <div>
              <span className="block mb-1">Target Language</span>
              <select 
                value={targetLang} 
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded focus:outline-none"
              >
                <option value="Python">Python</option>
                <option value="JavaScript">JavaScript</option>
                <option value="TypeScript">TypeScript</option>
                <option value="Go">Go</option>
                <option value="Rust">Rust</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Source Code</span>
              <textarea 
                value={codeToTranslate}
                onChange={(e) => setCodeToTranslate(e.target.value)}
                rows={10}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
              />
              <button 
                onClick={handleTranslate}
                disabled={isLoading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold"
              >
                {isLoading ? 'Translating Syntax...' : 'Compile Translate'}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Translated Output</span>
              <div className="relative flex-1">
                <textarea 
                  value={translatedCode}
                  readOnly
                  rows={10}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 focus:outline-none h-full min-h-[180px]"
                />
                {translatedCode && (
                  <button 
                    onClick={() => copyToClipboard(translatedCode, 'trans')}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 border border-slate-850 text-slate-450 hover:text-white rounded"
                  >
                    {copiedId === 'trans' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. UNIT TEST GENERATOR */}
      {toolId === 'unit-tester' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Unit Test Suite Generator</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Function Block Input</span>
              <textarea 
                value={codeForTests}
                onChange={(e) => setCodeForTests(e.target.value)}
                rows={10}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
              />
              <button 
                onClick={handleGenerateTests}
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold"
              >
                {isLoading ? 'Writing Assertions...' : 'Build Testing Suite'}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase font-mono">Test File Code</span>
              <div className="relative flex-1">
                <textarea 
                  value={generatedTests}
                  readOnly
                  rows={10}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 focus:outline-none h-full min-h-[180px]"
                />
                {generatedTests && (
                  <button 
                    onClick={() => copyToClipboard(generatedTests, 'tests')}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 border border-slate-850 text-slate-400 hover:text-white rounded"
                  >
                    {copiedId === 'tests' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. COMMIT & PR WRITER */}
      {toolId === 'commit-writer' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Semantic Commit Writer</h3>
          <div className="flex flex-col gap-2">
            <span className="text-xxs text-slate-400 font-bold uppercase">Git Diff Data</span>
            <textarea 
              value={gitDiff}
              onChange={(e) => setGitDiff(e.target.value)}
              rows={5}
              placeholder="Paste git diff changes..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
            />
          </div>

          <button 
            onClick={handleWriteCommit}
            disabled={isLoading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold"
          >
            {isLoading ? 'Structuring Message...' : 'Draft Commit Message'}
          </button>

          {commitMessage && (
            <div className="relative">
              <pre className="p-4 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                {commitMessage}
              </pre>
              <button 
                onClick={() => copyToClipboard(commitMessage, 'commit')}
                className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded"
              >
                {copiedId === 'commit' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
