'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Moon, Sun, ArrowLeft, Wrench } from 'lucide-react';
import ToolSystem from '../../components/ToolSystem';

export default function ToolboxPage() {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('zentro-theme') as 'dark' | 'light';
    if (savedTheme) {
      setThemeMode(savedTheme);
      document.documentElement.classList.toggle('light', savedTheme === 'light');
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextTheme);
    localStorage.setItem('zentro-theme', nextTheme);
    document.documentElement.classList.toggle('light', nextTheme === 'light');
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${themeMode === 'dark' ? 'bg-[#060a13] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Header bar */}
      <header className={`flex items-center justify-between px-6 py-3 border-b shrink-0 ${themeMode === 'dark' ? 'border-slate-800 bg-[#080d1a]' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-4">
          <Link href="/workspace" className="p-2 -ml-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-pink-600 text-white font-bold">
              <Wrench size={16} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">ZENTRO TOOLBOX</h1>
              <p className="text-xxs text-slate-400 font-medium tracking-wide uppercase">Offline Utilities</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
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
      <main className="flex-1 overflow-hidden p-4 md:p-8">
        <div className="max-w-6xl mx-auto h-full flex flex-col">
          <ToolSystem />
        </div>
      </main>
    </div>
  );
}
