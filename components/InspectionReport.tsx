"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Download,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  RotateCcw,
  Layers,
} from "lucide-react";
import { UnifiedCleanResult } from "@/lib/engine/orchestrator";

interface InspectionReportProps {
  result: UnifiedCleanResult;
  onReset: () => void;
}

export function InspectionReport({ result, onReset }: InspectionReportProps) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isText = result.mode === "text" || !result.cleanedBufferBase64;
  const status = result.status; // "success" | "partial" | "unchanged"

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
      {/* Dynamic Header Banner based on verified status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          {status === "success" && (
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
          )}
          {status === "unchanged" && (
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Info className="w-7 h-7" />
            </div>
          )}
          {status === "partial" && (
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {status === "success" && "クリーンアップ完了"}
                {status === "unchanged" && "対象情報は検出されませんでした"}
                {status === "partial" && "一部の情報が残存しています"}
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  status === "success"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : status === "unchanged"
                    ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }`}
              >
                {status === "success" && "再検査: 残存なし"}
                {status === "unchanged" && "元データ維持 (変更なし)"}
                {status === "partial" && "再検査: 一部未除去"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {status === "success" && "検出された対象項目を除去し、再検査で残存がないことを確認しました。"}
              {status === "unchanged" && "透かしやメタデータは検出されなかったため、元データに変更を加えていません。"}
              {status === "partial" && "一部の項目は現在のルールセットでは除去できませんでした。残存項目をご確認ください。"}
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

      {/* Detection & Verification Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Detected Info (Before) */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>事前検査 (Before)</span>
            <span className={result.stats.removedCount > 0 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
              {result.stats.removedCount > 0 ? `${result.stats.removedCount} 項目検出` : "検出なし (クリーン)"}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {result.inspectionBefore.details.length > 0 ? (
              result.inspectionBefore.details.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-amber-400 font-mono mt-0.5">•</span>
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-400 italic">透かしやメタデータは検出されませんでした</div>
            )}
            {result.inspectionBefore.details.length > 5 && (
              <div className="text-slate-400 text-[11px] pl-3">
                他 {result.inspectionBefore.details.length - 5} 項目
              </div>
            )}
          </div>
        </div>

        {/* Verification Info (After) */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>再検査結果 (After)</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                result.inspectionAfter.clean ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {result.inspectionAfter.clean
                  ? "残存 0 項目 (Clean)"
                  : `${result.stats.remainingItems.length} 項目残存`}
              </span>
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            {result.stats.removedCategories.length > 0 ? (
              result.stats.removedCategories.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>除去完了: {cat}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-400">除去処理は実行されませんでした（元データを維持）</div>
            )}

            {/* If partial, show remaining items clearly */}
            {result.stats.remainingItems.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800">
                <div className="text-amber-400 font-semibold mb-1">未除去の残存項目:</div>
                {result.stats.remainingItems.map((rem, idx) => (
                  <div key={idx} className="text-amber-300/90 pl-2">
                    ⚠ {rem}
                  </div>
                ))}
              </div>
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
              <label className="text-xs font-semibold text-slate-300">
                {status === "unchanged" ? "入力文章 (変更なし)" : "クリーンアップ済み文章"}
              </label>
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
                {status === "unchanged" && " (元ファイル維持)"}
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
              <span className="text-emerald-400">Verified Status:</span> {result.status}
            </div>
            <div>
              <span className="text-emerald-400">Original Size:</span> {result.stats.originalSize} bytes
            </div>
            <div>
              <span className="text-emerald-400">Cleaned Size:</span> {result.stats.cleanedSize} bytes
            </div>
            <div>
              <span className="text-emerald-400">Stripped Items:</span>{" "}
              {result.stats.removedCategories.join(", ") || "None"}
            </div>
            <div>
              <span className="text-emerald-400">Remaining Items:</span>{" "}
              {result.stats.remainingItems.join(", ") || "0 (Clean)"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
