"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
  UploadCloud,
  FileText,
  Sparkles,
  ArrowRight,
  Shield,
  Loader2,
  Trash2,
  FileCheck,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { DemoSamples } from "./DemoSamples";
import { InspectionReport } from "./InspectionReport";
import { UnifiedCleanResult } from "@/lib/engine/orchestrator";

export function WatermarkRemoverApp() {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleanResult, setCleanResult] = useState<UnifiedCleanResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (activeTab === "text" && !textInput.trim()) {
      setError("クリーンアップする文章を入力または貼り付けてください。");
      return;
    }

    if (activeTab === "file" && !selectedFile) {
      setError("クリーンアップするファイルを選択またはドロップしてください。");
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === "text") {
        const res = await fetch("/api/clean", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textInput }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "クリーンアップ処理に失敗しました。");
        }
        const data: UnifiedCleanResult = await res.json();
        setCleanResult(data);
      } else if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const res = await fetch("/api/clean", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "ファイルの処理に失敗しました。");
        }
        const data: UnifiedCleanResult = await res.json();
        setCleanResult(data);
      }
    } catch (err: any) {
      setError(err.message || "予期せぬエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCleanResult(null);
    setSelectedFile(null);
    setTextInput("");
    setError(null);
  };

  const handleSampleSelect = (sampleText: string) => {
    setActiveTab("text");
    setTextInput(sampleText);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          AI生成コンテンツをクリーンアップ
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          不可視ゼロ幅文字・Unicodeタグ透かし・C2PA / EXIF / XMP メタデータを自動検出し、
          元コンテンツを破壊せずに決定論的に除去します。
        </p>
      </div>

      {/* Main Container */}
      {cleanResult ? (
        <InspectionReport result={cleanResult} onReset={handleReset} />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Tab Selector */}
          <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setActiveTab("file");
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                activeTab === "file"
                  ? "bg-slate-800 text-white shadow-md shadow-black/20 border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>ファイルをアップロード</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("text");
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                activeTab === "text"
                  ? "bg-slate-800 text-white shadow-md shadow-black/20 border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-4 h-4 text-teal-400" />
              <span>文章を貼り付け</span>
            </button>
          </div>

          {/* File Upload Tab */}
          {activeTab === "file" && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.webp,.docx,.pdf,.txt,.md,.html"
                onChange={handleFileChange}
              />

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-500/5 scale-[0.99]"
                      : "border-slate-700/80 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/70"
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-200 mb-1">
                    ファイルをここにドロップ
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">または クリックしてファイルを選択</p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-400">
                    <span>対応形式: PNG, JPEG, WebP, DOCX, PDF, TXT, MD, HTML</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200">
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || "file"}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                    title="ファイルを削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Text Paste Tab */}
          {activeTab === "text" && (
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="ChatGPT, Claude, GeminiなどのAI生成テキストをここに貼り付けてください..."
                  rows={8}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-y"
                />
                {textInput && (
                  <button
                    type="button"
                    onClick={() => setTextInput("")}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>クリア</span>
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>文字数: {textInput.length} 文字</span>
                <span>不可視文字・特殊Unicodeを自動解析します</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm sm:text-base transition-all duration-200 shadow-xl shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-emerald-500/35 hover:scale-[1.005] active:scale-[0.995]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>検査してクリーンアップ中...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>検査してクリーンアップ</span>
                </>
              )}
            </button>
          </div>

          {/* Demo Samples */}
          <DemoSamples onSelectSample={handleSampleSelect} />
        </div>
      )}
    </div>
  );
}
