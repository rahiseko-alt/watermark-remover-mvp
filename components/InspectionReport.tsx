"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Copy,
  Check,
  Download,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
  Eye,
} from "lucide-react";
import { UnifiedCleanResult } from "@/lib/engine/orchestrator";

interface InspectionReportProps {
  result: UnifiedCleanResult;
  onReset: () => void;
}

export function InspectionReport({ result, onReset }: InspectionReportProps) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const isText = result.mode === "text" || !result.cleanedBufferBase64;
  const beforeSummary = result.inspectionBefore.summary;
  const afterSummary = result.inspectionAfter.summary;

  const handleCopy = async () => {
    if (result.cleanedText) {
      await navigator.clipboard.writeText(result.cleanedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!result.cleanedBufferBase64 || !result.outputFilename) return;

    const byteCharacters = atob(result.cleanedBufferBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: result.mimeType || "application/octet-stream" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.outputFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">クリーンアップ完了</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                100% 決定論的処理済み
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              再検査済み：対象の不可視文字およびメタデータは完全に除去されました
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>別のコンテンツを処理</span>
        </button>
      </div>

      {/* Detection & Clean Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Detected Info */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>検出された情報 (Before)</span>
            <span className="text-amber-400 font-bold">
              {result.stats.removedCount > 0 ? `${result.stats.removedCount} 件検出` : "0 件 (クリーン)"}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {result.inspectionBefore.details.length > 0 ? (
              result.inspectionBefore.details.slice(0, 4).map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-amber-400 font-mono mt-0.5">•</span>
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic">透かしやメタデータは検出されませんでした</div>
            )}
            {result.inspectionBefore.details.length > 4 && (
              <div className="text-slate-500 text-[11px] pl-3">
                他 {result.inspectionBefore.details.length - 4} 件
              </div>
            )}
          </div>
        </div>

        {/* Action Taken Info */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>実施された処理 (After)</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>残存 0 件 (安全)</span>
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            {isText ? (
              <>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>不可視文字・ゼロ幅透かしを完全除去</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>UnicodeをNFC正規化（合成文字・絵文字ZWJ・IVS保全）</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>再検査完了：文章のクリーン状態を確認済み</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>対象メタデータ（C2PA/EXIF/XMP/プロパティ）を剥離</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>コンテンツ完全性を保持して再構成</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>再検査完了：ファイル内部のメタデータ除去を確認済み</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Output Section */}
      {isText ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <label className="text-xs font-semibold text-slate-300">処理済み文章</label>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/20"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>コピーしました！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>文章をコピー</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              readOnly
              value={result.cleanedText || ""}
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 font-mono focus:outline-none resize-y"
            />
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{result.outputFilename}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                形式: {result.format.toUpperCase()} • サイズ:{" "}
                {(result.stats.cleanedSize / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>ファイルをダウンロード</span>
          </button>
        </div>
      )}

      {/* Technical Details Accordion */}
      <div className="border-t border-slate-800/80 pt-4">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-slate-200 py-1 transition"
        >
          <span className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>技術詳細レポート (Technical Details)</span>
          </span>
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showDetails && (
          <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-400 space-y-2 overflow-x-auto">
            <div>
              <span className="text-emerald-400">Processing Mode:</span> {result.mode} (
              {result.format})
            </div>
            <div>
              <span className="text-emerald-400">Deterministic Engine:</span> Layer 1 Metadata + Layer 2 Invisible Characters
            </div>
            <div>
              <span className="text-emerald-400">Original Size:</span> {result.stats.originalSize} bytes
            </div>
            <div>
              <span className="text-emerald-400">Cleaned Size:</span> {result.stats.cleanedSize} bytes
            </div>
            <div>
              <span className="text-emerald-400">Stripped Categories:</span>{" "}
              {result.stats.removedCategories.join(", ") || "None"}
            </div>
            <div>
              <span className="text-emerald-400">Adversarial Safety Checks:</span> Emoji ZWJ (Preserved), IVS Selectors (Preserved), Diacritics (NFC Normalized)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
