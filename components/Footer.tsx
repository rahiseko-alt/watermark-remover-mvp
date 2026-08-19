import React from "react";
import { CheckCircle2, CircleDashed, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 mt-20 py-12 text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-200 text-sm">Watermark Remover SaaS</span>
            </div>
            <p className="leading-relaxed text-slate-400 mb-2">
              AI生成コンテンツ（テキスト・画像・文書）に含まれる機械可読情報・不可視透かしを高精度に検査し、決定論的にクリーンアップします。
            </p>
            <p className="text-slate-500">MIT License / Zero-Retention Architecture</p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">MVP対応範囲 (Deterministic)</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1. メタデータ型 (EXIF, XMP, IPTC, DOCX/PDFプロパティ)</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>2. 不可視文字型 (ゼロ幅文字, Unicode Tags, Bidi)</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>絵文字ZWJ・日本語IVS・アクセント合成文字の保全</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">ロードマップ (Future Scope)</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-2">
                <CircleDashed className="w-3.5 h-3.5 text-slate-400" />
                <span>Phase 2: 統計的テキスト透かし (LLMリライト)</span>
              </li>
              <li className="flex items-center gap-2">
                <CircleDashed className="w-3.5 h-3.5 text-slate-400" />
                <span>Phase 3: 画像ピクセル型 (SynthID/Tree-Ring再構成)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
          <p>© 2026 Watermark Remover MVP. Based on watermarks-remover open source engine.</p>
          <div className="flex items-center gap-4">
            <span>Powered by Next.js & Sharp</span>
            <span>•</span>
            <a
              href="https://github.com/rahiseko-alt/watermark-remover-mvp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
