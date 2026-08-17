"use client";

import React from "react";
import { ShieldCheck, Sparkles, Lock, Cpu } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">WatermarkRemover</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                MVP v0.5.0
              </span>
            </div>
            <p className="text-xs text-slate-400">AI電子透かし・メタデータ除去 エンジン</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>ファイル非保持（メモリ即時消去）</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
            <span>決定論的クレンジング（LLM非依存）</span>
          </div>
        </div>
      </div>
    </header>
  );
}
