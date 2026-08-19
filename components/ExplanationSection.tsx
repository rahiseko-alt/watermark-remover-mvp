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
              文章の意味や写真の見た目を壊さずに、AI情報やメタデータを安全に消せる理由
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
                  AIが作った文章や画像には、人間の目には見えない<strong>「透明インクの特殊文字」</strong>や、ファイルの裏側に書かれた<strong>「AI生成メモ（メタデータ）」</strong>が埋め込まれることがあります。
                </p>
                <p className="leading-relaxed text-slate-300">
                  このツールは、文章を勝手に書き換えたりせず、<strong>その「透明な情報や裏側データ」だけをピンポイントで消しゴムで消す</strong>ようにクリーンアップします。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase">
                    <FileText className="w-4 h-4" />
                    <span>文章（テキスト）の場合</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    AIは単語の間に「幅ゼロの透明な文字」を隠して埋め込むことがあります。本ツールはその透明文字だけを綺麗に洗い流し、普通の文章だけを残します。
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
                    画像ファイルやWordファイルの内部に記録されている「AI作成証明（C2PA）」や「プロンプト（指示文）」などの裏側データだけを安全に剥ぎ取ります。（PNGは完全画質維持、JPEGは高品質再エンコード）
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
                    <span className="text-slate-300">画像内容を維持 + </span> <span className="text-emerald-400">裏側メタデータを消去</span>
                  </div>
                </div>
              </div>

              {/* Peace of mind guarantee */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-slate-300">
                  <div className="font-bold text-emerald-300">安心の安全設計（プライバシー保護）</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>アップロードしたファイルや文章はサーバーに一切保存されず、処理後すぐにメモリから消去されます。</li>
                    <li>絵文字（👨‍👩‍👧‍👦 や 🏳️‍🌈）や日本語の珍しい漢字（異体字）を誤って消さない保護機能を備えています。</li>
                    <li>透かしやメタデータが見つからなかった場合は、ファイルに余計な変更を加えずにそのまま返却します。</li>
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
                      <li>Unicode Tag Steganography: <code className="text-emerald-300">U+E0000</code> 〜 <code className="text-emerald-300">U+E007F</code> (Plane 14 タグ文字) の削除</li>
                      <li>双方向制御 (Bidi): <code className="text-emerald-300">U+202A-U+202E</code>, <code className="text-emerald-300">U+2066-U+2069</code> の無害化</li>
                      <li>Private Use Area (PUA): <code className="text-emerald-300">U+E000-U+F8FF</code> 等の除去</li>
                      <li>正規化: NFC (Canonical Composition) を適用</li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-850">
                    <span className="text-slate-200 font-bold">2. 偽陽性防止ガード (False-Positive Elimination)</span>
                    <ul className="list-disc list-inside pl-2 space-y-1 mt-1 text-slate-400">
                      <li><strong>絵文字 ZWJ 保護:</strong> <code className="text-emerald-300">Extended_Pictographic + ZWJ (\u200D)</code> シーケンスを保護区間化し、家族絵文字 (👩‍👩‍👧‍👦) や国旗 (🏳️‍🌈) の分解を防止。</li>
                      <li><strong>日本語 IVS / SVS 保護:</strong> 異体字セレクタ (<code className="text-emerald-300">U+E0100-U+E01EF</code>, <code className="text-emerald-300">U+FE00-U+FE0F</code>) は正当な文字として保全。</li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-850">
                    <span className="text-slate-200 font-bold">3. バイナリ・メタデータ剥離エンジン (Layer 1)</span>
                    <ul className="list-disc list-inside pl-2 space-y-1 mt-1 text-slate-400">
                      <li><strong>PNG / WebP:</strong> メタデータチャンク (<code className="text-emerald-300">tEXt</code>, <code className="text-emerald-300">zTXt</code>, <code className="text-emerald-300">iTXt</code>, <code className="text-emerald-300">EXIF</code>, <code className="text-emerald-300">XMP</code>) を可逆剥離。RGB/RGBAピクセルデータを完全維持。</li>
                      <li><strong>JPEG:</strong> 高品質再エンコード（quality: 98, mozjpeg）によりAPP1/APP13等のメタデータを剥離。（非可逆圧縮のためピクセル値の完全一致は保証されません）</li>
                      <li><strong>DOCX:</strong> <code className="text-emerald-300">docProps/core.xml</code>, <code className="text-emerald-300">custom.xml</code>, コメント, 変更履歴 (<code className="text-emerald-300">&lt;w:del&gt;</code>/<code className="text-emerald-300">&lt;w:ins&gt;</code>) をサニタイズ。</li>
                      <li><strong>PDF:</strong> Info辞書に加え、カタログから <code className="text-emerald-300">/Metadata</code> (XMP) および <code className="text-emerald-300">/Names /JavaScript</code>, <code className="text-emerald-300">/OpenAction</code> を物理削除。</li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-850">
                    <span className="text-slate-200 font-bold">4. 再検査と検証ステータス連動</span>
                    <p className="mt-1">
                      クリーニング後に独立した再検査を行い、<code className="text-emerald-300">success</code> (残存0件) / <code className="text-amber-300">partial</code> (一部未除去) / <code className="text-teal-300">unchanged</code> (変更なし) を正確に判定してUIに表示します。
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
