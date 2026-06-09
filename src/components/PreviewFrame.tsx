'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCw, 
  Terminal, 
  Eye, 
  Database,
  ExternalLink
} from 'lucide-react';

interface PreviewFrameProps {
  html: string;
  css: string;
  js: string;
  projectName?: string;
}

interface ConsoleLog {
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: string;
}

export default function PreviewFrame({ html, css, js, projectName = 'Untitled App' }: PreviewFrameProps) {
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Clear logs on code regeneration
  useEffect(() => {
    setConsoleLogs([]);
  }, [html, css, js]);

  // Construct iframe document with Local Backend Storage namespaces
  const buildIframeSrc = () => {
    // Extract head and body elements from HTML input
    let headContent = '';
    let bodyContent = '';

    if (html.includes('<head>') && html.includes('</head>')) {
      headContent = html.split('<head>')[1].split('</head>')[0];
    } else {
      headContent = `<title>${projectName}</title>`;
    }

    if (html.includes('<body>') && html.includes('</body>')) {
      bodyContent = html.split('<body>')[1].split('</body>')[0];
    } else {
      // Stripped HTML is just treated as body content
      bodyContent = html.replace(/<!DOCTYPE[^>]*>/i, '')
                         .replace(/<html>/i, '')
                         .replace(/<\/html>/i, '')
                         .replace(/<head>[^]*<\/head>/i, '')
                         .replace(/<body>/i, '')
                         .replace(/<\/body>/i, '');
    }

    // Injected storage namespace script
    const localBackendScript = `
      <script>
        (function() {
          const appNamespace = "sandboxed-app-${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-";
          
          // Hook Local Storage calls
          const origSet = localStorage.setItem;
          const origGet = localStorage.getItem;
          const origRemove = localStorage.removeItem;
          
          localStorage.setItem = function(key, val) {
            origSet.call(localStorage, appNamespace + key, val);
          };
          localStorage.getItem = function(key) {
            return origGet.call(localStorage, appNamespace + key);
          };
          localStorage.removeItem = function(key) {
            origRemove.call(localStorage, appNamespace + key);
          };
          
          // Intercept Console logs and send them to parent window
          const origLog = console.log;
          const origError = console.error;
          const origWarn = console.warn;
          const origInfo = console.info;
          
          function formatMsg(args) {
            return args.map(arg => {
              if (typeof arg === 'object') {
                try { return JSON.stringify(arg); } catch(e) { return String(arg); }
              }
              return String(arg);
            }).join(' ');
          }
          
          console.log = function(...args) {
            origLog.apply(console, args);
            window.parent.postMessage({ type: 'CONSOLE_LOG', logType: 'log', message: formatMsg(args) }, '*');
          };
          console.error = function(...args) {
            origError.apply(console, args);
            window.parent.postMessage({ type: 'CONSOLE_LOG', logType: 'error', message: formatMsg(args) }, '*');
          };
          console.warn = function(...args) {
            origWarn.apply(console, args);
            window.parent.postMessage({ type: 'CONSOLE_LOG', logType: 'warn', message: formatMsg(args) }, '*');
          };
          console.info = function(...args) {
            origInfo.apply(console, args);
            window.parent.postMessage({ type: 'CONSOLE_LOG', logType: 'info', message: formatMsg(args) }, '*');
          };
          
          // Error handler
          window.onerror = function(message, source, lineno, colno, error) {
            window.parent.postMessage({ 
              type: 'CONSOLE_LOG', 
              logType: 'error', 
              message: message + " (Line " + lineno + ":" + colno + ")"
            }, '*');
            return false;
          };
        })();
      </script>
    `;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${headContent}
          <style>
            ${css}
          </style>
          ${localBackendScript}
        </head>
        <body>
          ${bodyContent}
          <script>
            try {
              ${js}
            } catch (err) {
              console.error(err.message);
            }
          </script>
        </body>
      </html>
    `;
  };

  // Listen for logs sent from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CONSOLE_LOG') {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setConsoleLogs(prev => [...prev.slice(-99), {
          type: event.data.logType,
          message: event.data.message,
          timestamp: time
        }]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleRefresh = () => {
    setReloadKey(prev => prev + 1);
    setConsoleLogs([]);
  };

  const openInNewWindow = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(buildIframeSrc());
      newWindow.document.close();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#0e1427] px-4 py-2 select-none">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">Sandbox Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className="flex items-center justify-center p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-all"
            title="Reload Frame"
          >
            <RotateCw size={14} />
          </button>
          <button 
            onClick={openInNewWindow}
            className="flex items-center justify-center p-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded transition-all"
            title="Open Sandbox in new Tab"
          >
            <ExternalLink size={14} />
          </button>
          <button 
            onClick={() => setShowConsole(!showConsole)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded text-xs font-medium transition-all ${
              showConsole 
                ? 'bg-amber-950/20 border-amber-800/40 text-amber-400' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal size={12} />
            <span>Console</span>
            {consoleLogs.length > 0 && (
              <span className="flex items-center justify-center min-w-[16px] h-4 text-xxs font-bold bg-amber-500 text-slate-950 rounded-full px-1">
                {consoleLogs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Iframe content */}
      <div className="flex-1 relative bg-white">
        <iframe
          key={reloadKey}
          ref={iframeRef}
          srcDoc={buildIframeSrc()}
          sandbox="allow-scripts allow-modals"
          className="w-full h-full border-none bg-white"
          title="App Sandbox"
        />
      </div>

      {/* Developer Logs Console */}
      {showConsole && (
        <div className="h-44 bg-[#050813] border-t border-slate-800 flex flex-col font-mono">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a0f1d] border-b border-slate-800 text-slate-400 select-none">
            <span className="text-xxs uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Terminal size={10} /> Runtime Logs
            </span>
            <button 
              onClick={() => setConsoleLogs([])}
              className="text-xxs hover:text-slate-200"
            >
              Clear Logs
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 text-xxs select-text">
            {consoleLogs.length === 0 ? (
              <span className="text-slate-600 italic">No output logs registered yet.</span>
            ) : (
              consoleLogs.map((log, index) => (
                <div key={index} className="flex gap-2 leading-relaxed border-b border-slate-900/50 pb-1">
                  <span className="text-slate-500 font-normal shrink-0">{log.timestamp}</span>
                  <span className={`font-semibold shrink-0 uppercase ${
                    log.type === 'error' ? 'text-rose-400' :
                    log.type === 'warn' ? 'text-amber-400' :
                    log.type === 'info' ? 'text-sky-400' : 'text-slate-400'
                  }`}>
                    [{log.type}]
                  </span>
                  <span className="text-slate-300 break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
