'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, Copy, AlertCircle, Play, Plus, Trash2, Hash, Eye, 
  RefreshCw, FileText, Settings, Sliders, Moon, Sun, Lock
} from 'lucide-react';

interface DevUtilitiesProps {
  toolId: string;
}

// Helper to calculate MD5 in pure JS (compact implementation)
function md5(str: string) {
  var k = [], i = 0;
  for (; i < 64; ) k[i] = 0 | (Math.abs(Math.sin(++i)) * 4294967296);
  var md5cycle = function(x: any, k: any) {
    var a = x[0], b = x[1], c = x[2], d = x[3];
    var f, g, h, l, temp;
    for (var j = 0; j < 64; j++) {
      if (j < 16) { f = (b & c) | (~b & d); g = j; }
      else if (j < 32) { f = (d & b) | (~d & c); g = (5 * j + 1) % 16; }
      else if (j < 48) { f = b ^ c ^ d; g = (3 * j + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * j) % 16; }
      l = a + f + k[j] + (x[4 + g] | 0);
      temp = d;
      d = c;
      c = b;
      b = b + ((l << (j%4?j%2?j%3?15:21:12:7)) | (l >>> (32-(j%4?j%2?j%3?15:21:12:7))));
      a = temp;
    }
    x[0] = x[0] + a | 0;
    x[1] = x[1] + b | 0;
    x[2] = x[2] + c | 0;
    x[3] = x[3] + d | 0;
  };
  var md5blk = function(s: string) {
    var r = [], i = 0;
    for (; i < 64; i += 4) {
      r[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return r;
  };
  var n = str.length,
      state = [1732584193, -271733879, -1732584194, 271733878],
      j = 0;
  for (; j < n - 64; j += 64) md5cycle(state, md5blk(str.substring(j, j + 64)));
  str = str.substring(j);
  var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var tailLen = str.length;
  for (var k_idx = 0; k_idx < tailLen; k_idx++) {
    tail[k_idx >> 2] |= str.charCodeAt(k_idx) << ((k_idx & 3) << 3);
  }
  tail[tailLen >> 2] |= 0x80 << ((tailLen & 3) << 3);
  if (tailLen > 55) {
    md5cycle(state, tail);
    for (var m = 0; m < 16; m++) tail[m] = 0;
  }
  tail[14] = tailLen * 8;
  md5cycle(state, tail);
  return state.map(function(val) {
    var hex = "";
    for (var offset = 0; offset < 4; offset++) {
      var byteVal = (val >> (offset * 8)) & 0xff;
      hex += byteVal.toString(16).padStart(2, '0');
    }
    return hex;
  }).join('');
}

export default function DevUtilities({ toolId }: DevUtilitiesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- 1. JSON Formatter & Validator ---
  const [jsonInput, setJsonInput] = useState('{\n  "project": "Zentro",\n  "status": "online",\n  "features": ["WebGPU", "Offline Utilities", "Local AI"]\n}');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const handleFormatJson = (minify = false) => {
    setJsonError('');
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2));
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON format');
    }
  };

  // --- 2. API Request Playground ---
  const [apiMethod, setApiMethod] = useState('GET');
  const [apiUrl, setApiUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
  const [apiHeaders, setApiHeaders] = useState([{ key: 'Content-Type', value: 'application/json' }]);
  const [apiBody, setApiBody] = useState('');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const triggerApiCall = async () => {
    setApiLoading(true);
    setApiResponse(null);
    try {
      const headersObj: Record<string, string> = {};
      apiHeaders.forEach(h => { if (h.key) headersObj[h.key] = h.value; });
      const options: RequestInit = { method: apiMethod, headers: headersObj };
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(apiMethod) && apiBody) {
        options.body = apiBody;
      }
      const res = await fetch(apiUrl, options);
      const status = res.status;
      const statusText = res.statusText;
      let data;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { responseHeaders[k] = v; });
      setApiResponse({ status, statusText, headers: responseHeaders, data });
    } catch (e: any) {
      setApiResponse({ error: e.message || 'Fetch request failed' });
    } finally {
      setApiLoading(false);
    }
  };

  // --- 3. Base64 Encoder / Decoder ---
  const [base64Input, setBase64Input] = useState('Hello, Zentro Offline App Creator!');
  const [base64Output, setBase64Output] = useState('');
  const [base64Err, setBase64Err] = useState('');
  const handleBase64 = (encode = true) => {
    setBase64Err('');
    try {
      if (encode) {
        setBase64Output(btoa(unescape(encodeURIComponent(base64Input))));
      } else {
        setBase64Output(decodeURIComponent(escape(atob(base64Input))));
      }
    } catch (e: any) {
      setBase64Err(e.message || 'Base64 operation failed (check structure)');
    }
  };

  // --- 4. Cryptographic Hash Generator ---
  const [hashInput, setHashInput] = useState('The quick brown fox jumps over the lazy dog');
  const [hashes, setHashes] = useState({ md5: '', sha1: '', sha256: '', sha512: '' });
  const generateHashes = async () => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(hashInput);

      // SHA-1
      const sha1Buffer = await crypto.subtle.digest('SHA-1', data);
      const sha1Hex = Array.from(new Uint8Array(sha1Buffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      // SHA-256
      const sha256Buffer = await crypto.subtle.digest('SHA-256', data);
      const sha256Hex = Array.from(new Uint8Array(sha256Buffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      // SHA-512
      const sha512Buffer = await crypto.subtle.digest('SHA-512', data);
      const sha512Hex = Array.from(new Uint8Array(sha512Buffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      // Pure JS MD5 fallback
      const md5Hex = md5(hashInput);

      setHashes({ md5: md5Hex, sha1: sha1Hex, sha256: sha256Hex, sha512: sha512Hex });
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    if (toolId === 'hash-gen') {
      generateHashes();
    }
  }, [hashInput, toolId]);

  // --- 5. Color & CSS Studio ---
  const [colorHex, setColorHex] = useState('#6366f1');
  const [colorRgb, setColorRgb] = useState('rgb(99, 102, 241)');
  const [colorHsl, setColorHsl] = useState('hsl(239, 84%, 67%)');
  const [shadowX, setShadowX] = useState(0);
  const [shadowY, setShadowY] = useState(10);
  const [shadowBlur, setShadowBlur] = useState(25);
  const [shadowSpread, setShadowSpread] = useState(-5);
  const [shadowColor, setShadowColor] = useState('rgba(0, 0, 0, 0.3)');

  const handleHexChange = (hex: string) => {
    setColorHex(hex);
    // Simple hex to rgb
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      setColorRgb(`rgb(${r}, ${g}, ${b})`);

      // rgb to hsl
      const rRatio = r / 255;
      const gRatio = g / 255;
      const bRatio = b / 255;
      const max = Math.max(rRatio, gRatio, bRatio);
      const min = Math.min(rRatio, gRatio, bRatio);
      let h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case rRatio: h = (gRatio - bRatio) / d + (gRatio < bRatio ? 6 : 0); break;
          case gRatio: h = (bRatio - rRatio) / d + 2; break;
          case bRatio: h = (rRatio - gRatio) / d + 4; break;
        }
        h = Math.round(h * 60);
      }
      setColorHsl(`hsl(${h}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`);
    }
  };

  // --- 6. Diff & Merge Viewer ---
  const [diffOriginal, setDiffOriginal] = useState('function calculateSum(a, b) {\n  // Returns calculation\n  return a + b;\n}');
  const [diffModified, setDiffModified] = useState('function calculateSum(a, b, c = 0) {\n  // Returns total addition\n  return a + b + c;\n}');
  const [diffResult, setDiffResult] = useState<{ type: 'same' | 'added' | 'removed' | 'modified'; text: string }[]>([]);
  
  const generateDiff = () => {
    const origLines = diffOriginal.split('\n');
    const modLines = diffModified.split('\n');
    const result: { type: 'same' | 'added' | 'removed' | 'modified'; text: string }[] = [];
    
    const maxLen = Math.max(origLines.length, modLines.length);
    for (let i = 0; i < maxLen; i++) {
      const orig = origLines[i];
      const mod = modLines[i];
      if (orig === mod) {
        result.push({ type: 'same', text: orig || ' ' });
      } else if (orig !== undefined && mod === undefined) {
        result.push({ type: 'removed', text: orig });
      } else if (orig === undefined && mod !== undefined) {
        result.push({ type: 'added', text: mod });
      } else {
        result.push({ type: 'modified', text: `[Orig] ${orig}  -->  [Mod] ${mod}` });
      }
    }
    setDiffResult(result);
  };

  // --- 7. JavaScript REPL Sandbox ---
  const [replInput, setReplInput] = useState('// JavaScript Playground\nconst list = [10, 20, 30, 40];\nconst doubled = list.map(n => n * 2);\nconsole.log("Doubled array: ", doubled);\nconsole.log("Calculated total: ", list.reduce((a, b) => a + b, 0));');
  const [replLogs, setReplLogs] = useState<string[]>([]);
  const executeRepl = () => {
    setReplLogs([]);
    const originalLog = console.log;
    const tempLogs: string[] = [];
    console.log = (...args) => {
      tempLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    };

    try {
      // Evaluate in try catch block
      const result = new Function(replInput)();
      if (result !== undefined) {
        tempLogs.push(`=> Returned: ${typeof result === 'object' ? JSON.stringify(result) : String(result)}`);
      }
    } catch (e: any) {
      tempLogs.push(`[Error] ${e.message}`);
    } finally {
      console.log = originalLog;
      setReplLogs(tempLogs);
    }
  };

  // --- 8. HTML Live Preview ---
  const [htmlCode, setHtmlCode] = useState('<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body {\n      background: #090e1a;\n      color: #6366f1;\n      font-family: sans-serif;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      height: 90vh;\n      margin: 0;\n    }\n    .card {\n      padding: 30px;\n      border: 1px solid rgba(99, 102, 241, 0.3);\n      border-radius: 12px;\n      background: rgba(255, 255, 255, 0.02);\n      text-align: center;\n      backdrop-filter: blur(10px);\n    }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h1>Hello Live Sandbox!</h1>\n    <p>Write HTML, CSS, and JS on the left side.</p>\n  </div>\n</body>\n</html>');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const updateIframe = () => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlCode);
        doc.close();
      }
    }
  };
  useEffect(() => {
    if (toolId === 'live-preview') {
      updateIframe();
    }
  }, [htmlCode, toolId]);

  // --- 9. CSV ↔ JSON Converter ---
  const [csvText, setCsvText] = useState('name,age,role\nAlice,30,Developer\nBob,25,Designer\nCharlie,35,Manager');
  const [jsonText, setJsonText] = useState('[\n  { "name": "Alice", "age": 30, "role": "Developer" },\n  { "name": "Bob", "age": 25, "role": "Designer" },\n  { "name": "Charlie", "age": 35, "role": "Manager" }\n]');
  const [convError, setConvError] = useState('');
  
  const handleCsvToJson = () => {
    setConvError('');
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) throw new Error('CSV needs headers and at least one row');
      const headers = lines[0].split(',');
      const result = [];
      for (let i = 1; i < lines.length; i++) {
        const obj: any = {};
        const currentline = lines[i].split(',');
        headers.forEach((h, index) => {
          const val = currentline[index]?.trim() || '';
          obj[h.trim()] = isNaN(Number(val)) ? val : Number(val);
        });
        result.push(obj);
      }
      setJsonText(JSON.stringify(result, null, 2));
    } catch (e: any) {
      setConvError(e.message || 'Failed CSV conversion');
    }
  };

  const handleJsonToCsv = () => {
    setConvError('');
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error('JSON input must be an array of objects');
      if (parsed.length === 0) throw new Error('Array cannot be empty');
      const headers = Object.keys(parsed[0]);
      const csvRows = [headers.join(',')];
      parsed.forEach(obj => {
        const values = headers.map(h => {
          const val = String(obj[h] || '');
          return val.includes(',') ? `"${val}"` : val;
        });
        csvRows.push(values.join(','));
      });
      setCsvText(csvRows.join('\n'));
    } catch (e: any) {
      setConvError(e.message || 'Failed JSON conversion');
    }
  };

  // --- 10. Password Generator ---
  const [pwLength, setPwLength] = useState(16);
  const [pwUpper, setPwUpper] = useState(true);
  const [pwLower, setPwLower] = useState(true);
  const [pwNumbers, setPwNumbers] = useState(true);
  const [pwSymbols, setPwSymbols] = useState(true);
  const [generatedPw, setGeneratedPw] = useState('');
  const [pwStrength, setPwStrength] = useState('');

  const buildPassword = () => {
    let charset = '';
    if (pwUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (pwLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (pwNumbers) charset += '0123456789';
    if (pwSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) {
      setGeneratedPw('');
      setPwStrength('');
      return;
    }

    let pw = '';
    for (let i = 0; i < pwLength; i++) {
      const idx = Math.floor(Math.random() * charset.length);
      pw += charset[idx];
    }
    setGeneratedPw(pw);

    // Calc simple strength
    let score = 0;
    if (pwLength >= 12) score++;
    if (pwLength >= 16) score++;
    if (pwUpper && pwLower) score++;
    if (pwNumbers) score++;
    if (pwSymbols) score++;
    
    if (score <= 2) setPwStrength('Weak 🔴');
    else if (score <= 4) setPwStrength('Medium 🟡');
    else setPwStrength('Strong & Secure 🟢');
  };
  useEffect(() => {
    if (toolId === 'password-gen') {
      buildPassword();
    }
  }, [pwLength, pwUpper, pwLower, pwNumbers, pwSymbols, toolId]);

  // --- 11. Visual Cron Builder ---
  const [cronMin, setCronMin] = useState('*');
  const [cronHour, setCronHour] = useState('*');
  const [cronDay, setCronDay] = useState('*');
  const [cronMonth, setCronMonth] = useState('*');
  const [cronWeek, setCronWeek] = useState('*');
  const [cronDescription, setCronDescription] = useState('Runs every minute');

  const buildCronExpression = () => {
    const expr = `${cronMin} ${cronHour} ${cronDay} ${cronMonth} ${cronWeek}`;
    
    // Simple descriptive translation for core options
    let desc = 'Runs ';
    if (cronMin === '*' && cronHour === '*' && cronDay === '*' && cronMonth === '*' && cronWeek === '*') {
      desc += 'every minute of every day.';
    } else {
      desc += `at minute (${cronMin}), hour (${cronHour}), day of month (${cronDay}), month (${cronMonth}), day of week (${cronWeek}).`;
    }
    setCronDescription(desc);
  };
  useEffect(() => {
    if (toolId === 'cron-builder') {
      buildCronExpression();
    }
  }, [cronMin, cronHour, cronDay, cronMonth, cronWeek, toolId]);


  return (
    <div className="flex flex-col gap-5 text-slate-100">
      {/* 1. JSON FORMATTER */}
      {toolId === 'json-beautifier' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">JSON Formatter & Validator</h3>
            {jsonError ? (
              <span className="text-xxs text-rose-400 font-semibold flex items-center gap-1"><AlertCircle size={12} /> {jsonError}</span>
            ) : (
              <span className="text-xxs text-emerald-400 font-semibold flex items-center gap-1">Valid JSON Schema</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Raw Input</span>
              <textarea 
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={10}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => handleFormatJson(false)}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Prettify
                </button>
                <button 
                  onClick={() => handleFormatJson(true)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all"
                >
                  Minify
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Formatted Output</span>
              <div className="relative flex-1">
                <textarea 
                  value={jsonOutput}
                  readOnly
                  rows={10}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 focus:outline-none h-full min-h-[200px]"
                />
                {jsonOutput && (
                  <button 
                    onClick={() => copyToClipboard(jsonOutput, 'json')}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 border border-slate-800 hover:text-white text-slate-400 rounded transition-colors"
                  >
                    {copiedId === 'json' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. API REQUEST PLAYGROUND */}
      {toolId === 'api-tester' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">HTTP REST Client Console</h3>
          <div className="flex gap-2">
            <select 
              value={apiMethod} 
              onChange={(e) => setApiMethod(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-indigo-400 text-xs font-bold focus:outline-none"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input 
              type="text" 
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button 
              onClick={triggerApiCall}
              disabled={apiLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all"
            >
              {apiLoading ? 'Executing...' : 'Fire Call'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 flex flex-col gap-4">
              {/* Headers config */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xxs text-slate-400 font-bold uppercase">HTTP Headers</span>
                  <button 
                    onClick={() => setApiHeaders([...apiHeaders, { key: '', value: '' }])}
                    className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                  >
                    <Plus size={10} /> Add Row
                  </button>
                </div>
                <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {apiHeaders.map((header, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        placeholder="Header" 
                        value={header.key}
                        onChange={(e) => {
                          const updated = [...apiHeaders];
                          updated[idx].key = e.target.value;
                          setApiHeaders(updated);
                        }}
                        className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none"
                      />
                      <input 
                        type="text" 
                        placeholder="Value" 
                        value={header.value}
                        onChange={(e) => {
                          const updated = [...apiHeaders];
                          updated[idx].value = e.target.value;
                          setApiHeaders(updated);
                        }}
                        className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none"
                      />
                      <button 
                        onClick={() => setApiHeaders(apiHeaders.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body if non GET */}
              {['POST', 'PUT', 'PATCH'].includes(apiMethod) && (
                <div className="flex flex-col gap-2">
                  <span className="text-xxs text-slate-400 font-bold uppercase">Payload Body</span>
                  <textarea 
                    value={apiBody}
                    onChange={(e) => setApiBody(e.target.value)}
                    rows={4}
                    placeholder="{}"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="md:col-span-7 flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Response Output</span>
              {apiResponse ? (
                <div className="flex flex-col gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl h-full min-h-[200px]">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold">Status:</span>
                    <span className={`font-black ${apiResponse.status >= 200 && apiResponse.status < 300 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {apiResponse.status || 'ERROR'} {apiResponse.statusText || ''}
                    </span>
                  </div>
                  <pre className="flex-1 p-3 bg-slate-900/40 rounded border border-slate-800 text-[10px] font-mono text-slate-300 overflow-auto max-h-[180px]">
                    {JSON.stringify(apiResponse.error || apiResponse.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="flex-1 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-xs italic min-h-[140px]">
                  Ready to fire network calls...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. BASE64 ENCODER / DECODER */}
      {toolId === 'base64-encode' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Base64 Encoder & Decoder</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Original Text / Decoded</span>
              <textarea 
                value={base64Input}
                onChange={(e) => setBase64Input(e.target.value)}
                rows={8}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBase64(true)}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  Encode String
                </button>
                <button 
                  onClick={() => handleBase64(false)}
                  className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
                >
                  Decode Base64
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase font-mono">Base64 Output / Encoded</span>
              <div className="relative flex-1">
                <textarea 
                  value={base64Output}
                  readOnly
                  rows={8}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 h-full min-h-[180px] focus:outline-none"
                />
                {base64Output && (
                  <button 
                    onClick={() => copyToClipboard(base64Output, 'b64')}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded"
                  >
                    {copiedId === 'b64' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
              {base64Err && (
                <span className="text-xxs text-rose-400 flex items-center gap-1"><AlertCircle size={12} /> {base64Err}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. CRYPTO HASH GENERATOR */}
      {toolId === 'hash-gen' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cryptographic Hash Generator</h3>
          <div className="flex flex-col gap-2">
            <span className="text-xxs text-slate-400 font-bold uppercase">Source String Input</span>
            <input 
              type="text" 
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex flex-col gap-3 bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
            {Object.entries(hashes).map(([algo, hexVal]) => (
              <div key={algo} className="flex flex-col md:flex-row md:items-center gap-2">
                <span className="w-24 text-xxs font-bold text-slate-400 uppercase tracking-widest">{algo}</span>
                <div className="flex-1 flex gap-2">
                  <input 
                    type="text" 
                    readOnly
                    value={hexVal}
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800/80 rounded-lg text-[10px] font-mono text-indigo-300 focus:outline-none"
                  />
                  <button 
                    onClick={() => copyToClipboard(hexVal, algo)}
                    className="p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    {copiedId === algo ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. COLOR & CSS STUDIO */}
      {toolId === 'color-studio' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Color space Converter & CSS Studio</h3>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Color Convert */}
            <div className="md:col-span-5 flex flex-col gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
              <span className="text-xxs text-slate-400 font-bold uppercase">Color Picker</span>
              <div className="flex gap-4 items-center">
                <input 
                  type="color" 
                  value={colorHex}
                  onChange={(e) => handleHexChange(e.target.value)}
                  className="w-14 h-14 bg-transparent border-0 rounded cursor-pointer shrink-0"
                />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input type="text" readOnly value={colorHex} className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-xs" />
                    <button onClick={() => copyToClipboard(colorHex, 'hex')} className="p-1 bg-slate-950 border border-slate-800 rounded"><Copy size={12} /></button>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={colorRgb} className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-xs" />
                    <button onClick={() => copyToClipboard(colorRgb, 'rgb')} className="p-1 bg-slate-950 border border-slate-800 rounded"><Copy size={12} /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* CSS Shadow Studio */}
            <div className="md:col-span-7 flex flex-col gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
              <span className="text-xxs text-slate-400 font-bold uppercase">CSS Box-Shadow Builder</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400">Shift X ({shadowX}px)</label>
                  <input type="range" min="-50" max="50" value={shadowX} onChange={(e) => setShadowX(parseInt(e.target.value))} className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400">Shift Y ({shadowY}px)</label>
                  <input type="range" min="-50" max="50" value={shadowY} onChange={(e) => setShadowY(parseInt(e.target.value))} className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400">Blur ({shadowBlur}px)</label>
                  <input type="range" min="0" max="100" value={shadowBlur} onChange={(e) => setShadowBlur(parseInt(e.target.value))} className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-slate-400">Spread ({shadowSpread}px)</label>
                  <input type="range" min="-30" max="30" value={shadowSpread} onChange={(e) => setShadowSpread(parseInt(e.target.value))} className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                </div>
              </div>

              <div className="flex gap-3 items-center justify-between border-t border-slate-800/80 pt-3">
                <div className="w-24 h-24 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center relative">
                  <div 
                    className="w-10 h-10 rounded bg-indigo-600" 
                    style={{ boxShadow: `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}` }}
                  ></div>
                </div>
                <div className="flex-1 flex flex-col gap-1.5 ml-4">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Box Shadow Snippet</span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={`box-shadow: ${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor};`} 
                      className="flex-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-[9px] text-indigo-400"
                    />
                    <button 
                      onClick={() => copyToClipboard(`box-shadow: ${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor};`, 'shadow')}
                      className="p-1 bg-slate-950 border border-slate-800 rounded hover:text-white"
                    >
                      {copiedId === 'shadow' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. DIFF & MERGE VIEWER */}
      {toolId === 'diff-viewer' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Visual Diff Viewer</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Original Text</span>
              <textarea 
                value={diffOriginal}
                onChange={(e) => setDiffOriginal(e.target.value)}
                rows={5}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Modified Text</span>
              <textarea 
                value={diffModified}
                onChange={(e) => setDiffModified(e.target.value)}
                rows={5}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
              />
            </div>
          </div>
          <button 
            onClick={generateDiff}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Compute File Difference
          </button>

          {diffResult.length > 0 && (
            <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs max-h-[220px] overflow-y-auto">
              {diffResult.map((line, idx) => (
                <div 
                  key={idx} 
                  className={`px-2 py-0.5 whitespace-pre-wrap ${
                    line.type === 'added' ? 'bg-emerald-950/30 text-emerald-400 border-l-2 border-emerald-500' :
                    line.type === 'removed' ? 'bg-rose-950/30 text-rose-400 border-l-2 border-rose-500' :
                    line.type === 'modified' ? 'bg-amber-950/20 text-amber-400 border-l-2 border-amber-500' :
                    'text-slate-400'
                  }`}
                >
                  {line.type === 'added' ? `+ ${line.text}` :
                   line.type === 'removed' ? `- ${line.text}` :
                   `  ${line.text}`}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. JAVASCRIPT REPL SANDBOX */}
      {toolId === 'js-repl' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">JavaScript Sandbox REPL</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Executable Code</span>
              <textarea 
                value={replInput}
                onChange={(e) => setReplInput(e.target.value)}
                rows={8}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
              />
              <button 
                onClick={executeRepl}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Play size={12} /> Run Sandbox Code
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Captured Console Logs</span>
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] min-h-[160px] overflow-y-auto">
                {replLogs.map((log, idx) => (
                  <div key={idx} className={log.startsWith('[Error]') ? 'text-rose-400' : log.startsWith('=>') ? 'text-indigo-400 font-bold' : 'text-slate-300'}>
                    {log}
                  </div>
                ))}
                {replLogs.length === 0 && (
                  <span className="text-slate-600 italic">No output logged yet. Use console.log() inside scripts.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. HTML LIVE PREVIEW */}
      {toolId === 'live-preview' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">HTML / CSS Live Sandbox</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">HTML / CSS / JS Editor</span>
              <textarea 
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                rows={10}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
              />
              <button 
                onClick={updateIframe}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg"
              >
                Refresh Frame
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">Isolated Preview Frame</span>
              <iframe 
                ref={iframeRef}
                title="HTML Live Sandbox"
                className="w-full border border-slate-800 rounded-xl bg-white min-h-[200px] h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* 9. CSV ↔ JSON CONVERTER */}
      {toolId === 'csv-json' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">CSV ↔ JSON Schema Converter</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">CSV Input / Output</span>
              <textarea 
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={8}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
              />
              <button 
                onClick={handleCsvToJson}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
              >
                Convert CSV to JSON →
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xxs text-slate-400 font-bold uppercase">JSON Input / Output</span>
              <textarea 
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={8}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none"
              />
              <button 
                onClick={handleJsonToCsv}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-lg text-xs font-bold"
              >
                ← Convert JSON to CSV
              </button>
            </div>
          </div>
          {convError && (
            <span className="text-xxs text-rose-400 flex items-center gap-1"><AlertCircle size={12} /> {convError}</span>
          )}
        </div>
      )}

      {/* 10. PASSWORD GENERATOR */}
      {toolId === 'password-gen' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Offline Password Generator</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-4 bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
              <span className="text-xxs text-slate-400 font-bold uppercase">Criteria Dials</span>
              
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-slate-300 font-medium">
                  <span>Character Length</span>
                  <span className="text-indigo-400 font-mono font-bold">{pwLength}</span>
                </div>
                <input 
                  type="range" min="8" max="64" value={pwLength} 
                  onChange={(e) => setPwLength(parseInt(e.target.value))} 
                  className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={pwUpper} onChange={(e) => setPwUpper(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0" />
                  Uppercase (A-Z)
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={pwLower} onChange={(e) => setPwLower(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0" />
                  Lowercase (a-z)
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={pwNumbers} onChange={(e) => setPwNumbers(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0" />
                  Numbers (0-9)
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input type="checkbox" checked={pwSymbols} onChange={(e) => setPwSymbols(e.target.checked)} className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0" />
                  Symbols (!@#$)
                </label>
              </div>

              <button 
                onClick={buildPassword}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
              >
                Generate Password
              </button>
            </div>

            <div className="flex flex-col gap-3 justify-center bg-slate-900/20 p-5 border border-slate-805 rounded-xl">
              <span className="text-xxs text-slate-500 font-bold uppercase tracking-widest">Calculated Output</span>
              
              {generatedPw ? (
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <input 
                      type="text" 
                      readOnly 
                      value={generatedPw} 
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-indigo-300 pr-12 focus:outline-none"
                    />
                    <button 
                      onClick={() => copyToClipboard(generatedPw, 'pw')}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded"
                    >
                      {copiedId === 'pw' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Security Strength:</span>
                    <span className="font-bold">{pwStrength}</span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic text-center">Enable at least one checkbox dial.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 11. VISUAL CRON BUILDER */}
      {toolId === 'cron-builder' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cron Schedule Builder</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xxs text-slate-450 uppercase font-bold tracking-wider block mb-1">Minutes</label>
              <input type="text" value={cronMin} onChange={(e) => setCronMin(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-indigo-400 text-center focus:outline-none" />
            </div>
            <div>
              <label className="text-xxs text-slate-450 uppercase font-bold tracking-wider block mb-1">Hours</label>
              <input type="text" value={cronHour} onChange={(e) => setCronHour(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-indigo-400 text-center focus:outline-none" />
            </div>
            <div>
              <label className="text-xxs text-slate-450 uppercase font-bold tracking-wider block mb-1">Day of Month</label>
              <input type="text" value={cronDay} onChange={(e) => setCronDay(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-indigo-400 text-center focus:outline-none" />
            </div>
            <div>
              <label className="text-xxs text-slate-450 uppercase font-bold tracking-wider block mb-1">Month</label>
              <input type="text" value={cronMonth} onChange={(e) => setCronMonth(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-indigo-400 text-center focus:outline-none" />
            </div>
            <div>
              <label className="text-xxs text-slate-450 uppercase font-bold tracking-wider block mb-1">Day of Week</label>
              <input type="text" value={cronWeek} onChange={(e) => setCronWeek(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-indigo-400 text-center focus:outline-none" />
            </div>
          </div>

          <div className="bg-slate-900/40 p-4 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1 text-left">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block">Cron Expression Output</span>
              <span className="text-sm font-bold text-white font-mono">{`${cronMin} ${cronHour} ${cronDay} ${cronMonth} ${cronWeek}`}</span>
            </div>
            <div className="flex-1 text-left md:border-l md:border-slate-800/80 md:pl-4">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block">Schedule Description</span>
              <span className="text-xs text-slate-350">{cronDescription}</span>
            </div>
            <button 
              onClick={() => copyToClipboard(`${cronMin} ${cronHour} ${cronDay} ${cronMonth} ${cronWeek}`, 'cron')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2"
            >
              {copiedId === 'cron' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
