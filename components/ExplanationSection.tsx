"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  Sparkles,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Smile,
  EyeOff,
  DatabaseZap,
} from "lucide-react";

export function ExplanationSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"simple" | "technical">("simple");

  return (
    <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>どうやって透かしを消しているの？（仕組み解説）</span>
            </h3>
            <p className="text-xs text-slate-400">
              文章の意味や写真の見た目を壊さずに、AI情報だけを安全に消せる理由
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
        >
          <span>{isOpen ? "解説を閉じる" : "解説を見る"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-6 pt-6 border-t border-slate-800 space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setMode("simple")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition ${
                mode === "simple"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>🌱 わかりやすい簡易解説（非エンジニア向け）</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("technical")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition ${
                mode === "technical"
                  ? "bg-slate-800 text-emerald-300 shadow-md border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>⚡ 技術的な詳細解説（エンジニア向け）</span>
            </button>
          </div>

          {/* Simple Mode Content */}
          {mode === "simple" && (
            <div className="space-y-6 text-sm text-slate-300">
              <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 space-y-3">
                <h4 className="text-emerald-400 font-bold text-base flex items-center gap-2">
                  <EyeOff className="w-4 h-4" />
                  <span>3行でわかる！このツールの仕組み</span>
                </h4>
                <p className="leading-relaxed text-slate-300">
                  AIが作った文章や画像には、人間の目には見えない<strong>「透明インクの特殊文字」</strong>や、ファイルの裏側に書かれた<strong>「AI生成メモ（メタデータ）」</strong>が埋め込まれています。
                </p>
                <p className="leading-relaxed text-slate-300">
                  このツールは、文章を勝手に書き換えたり画像を荒くしたりせず、<strong>その「透明な情報」だけをピンポイントで消しゴムで消す</strong>ようにクリーンアップします。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase">
                    <FileText className="w-4 h-4" />
                    <span>文章（テキスト）の場合</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    AIは単語と単語の間に「幅ゼロの透明な文字」を隠して埋め込みます。本ツールはその透明文字だけを綺麗に洗い流し、普通の文字だけを残します。
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
                    <span className="text-red-400 line-through">AI生成[透明文字]テキスト</span> ➔ <span className="text-emerald-400">AI生成テキスト</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase">
                    <ImageIcon className="w-4 h-4" />
                    <span>写真・文書（画像・PDF・Word）の場合</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    画像ファイルやWordファイルの内部に記録されている「AI作成証明（C2PA）」や「作成時の命令文（プロンプト）」などの裏側データだけを安全に剥ぎ取ります。写真の画質は1ミリも落ちません。
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
                    <span className="text-slate-300">写真の見た目そのまま + </span> <span className="text-emerald-400">裏側メモ（C2PA/EXIF）を完全消去</span>
                  </div>
                </div>
              </div>

              {/* Peace of mind guarantee */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-slate-300">
                  <div className="font-bold text-emerald-300">安心の安全設計（プライバシー保護）</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>アップロードしたファイルや文章はサーバーに一切保存されず、処理後すぐに消去されます。</li>
                    <li>絵文字（👨‍👩‍👧‍👦 や 🏳️‍🌈）や日本語の珍しい漢字（異体字）を誤って消さない保護機能を備えています。</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Technical Mode Content */}
          {mode === "technical" && (
            <div className="space-y-6 text-xs text-slate-300 font-mono">
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-emerald-400 font-bold text-sm">
                  <span>⚙️ アーキテクチャ & パイプライン仕様 (MVP Scope: Layer 1 & 2)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    Deterministic / Non-LLM
                  </span>
                </div>

                <div className="space-y-3 leading-relaxed text-slate-400 text-xs">
                  <div>
                    <span className="text-slate-200 font-bold">1. 不可視文字・Unicodeステガノグラフィ解析 (Layer 2)</span>
                    <ul className="list-disc list-inside pl-2 space-y-1 mt-1 text-slate-400">
                      <li>ゼロ幅文字: <code className="text-emerald-300">U+200B</code> (ZWSP), <code className="text-emerald-300">U+200C</code> (ZWNJ), <code className="text-emerald-300">U+FEFF</code> (ZWNBSP), <code className="text-emerald-300">U+2060</code> (Word Joiner) の抽出・除去</li>
                      <li>Unicode Tag Steganography: <code className="text-emerald-300">U+E0000</code> 〜 <code className="text-emerald-300">U+E007F</code> (Plane 14 タグ文字埋め込み) の全削除</li>
                      <li>双方向制御 (Bidi): <code className="text-emerald-300">U+202A-U+202E</code>, <code className="text-emerald-300">U+2066-U+2069</code> の無害化</li>
                      <li>Private Use Area (PUA): <code className="text-emerald-300">U+E000-U+F8FF</code> 等の除去</li>
                      <li>正規化: NFC (Canonical Composition) を適用し、アクセント記号や濁点の結合を保全</li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-850">
                    <span className="text-slate-200 font-bold">2. 偽陽性防止ガード (False-Positive Elimination)</span>
                    <ul className="list-disc list-inside pl-2 space-y-1 mt-1 text-slate-400">
                      <li><strong>絵文字 ZWJ 保護:</strong> <code className="text-emerald-300">Extended_Pictographic + ZWJ (\u200D)</code> シーケンスを正規表現で保護区間化し、家族絵文字 (👩‍👩‍👧‍👦) や国旗 (🏳️‍🌈) の分解を防止。</li>
                      <li><strong>日本語 IVS / SVS 保護:</strong> 異体字セレクタ (<code className="text-emerald-300">U+E0100-U+E01EF</code>, <code className="text-emerald-300">U+FE00-U+FE0F</code>) は正当な文字として保全。</li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-850">
                    <span className="text-slate-200 font-bold">3. バイナリ・メタデータ剥離エンジン (Layer 1)</span>
                    <ul className="list-disc list-inside pl-2 space-y-1 mt-1 text-slate-400">
                      <li><strong>C2PA / JUMBF:</strong> JPEG APP11 / PNG c2pa チャンク / WebP メタデータをバイナリ切除。</li>
                      <li><strong>PNG Prompt Chunks:</strong> Stable Diffusion / Midjourney / ComfyUI のプロンプトが格納される <code className="text-emerald-300">tEXt</code>, <code className="text-emerald-300">zTXt</code>, <code className="text-emerald-300">iTXt</code> を剥離。</li>
                      <li><strong>Lossless Pixel Guarantee:</strong> 画像ピクセルデータ（RGB/RGBA）は再圧縮による画質劣化や色変色（ガンマ狂い）を起こさずに 100% 維持。</li>
                      <li><strong>DOCX / PDF:</strong> <code className="text-emerald-300">docProps/core.xml</code>, <code className="text-emerald-300">custom.xml</code>, コメント, 変更履歴, PDF Info辞書 / XMPストリームを消去し、Zip-Slipおよび悪意あるスクリプトをサニタイズ。</li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-850">
                    <span className="text-slate-200 font-bold">4. 冪等性とプライバシー (Zero Retention)</span>
                    <p className="mt-1">
                      <code className="text-emerald-300">f(f(x)) === f(x)</code> の冪等性を保証。リクエストはオンメモリでストリーム処理され、ディスク永続化や外部LLMへの通信は行われません。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
