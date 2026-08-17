"use client";

import React from "react";
import { Sparkles, FileText, Smile, Tag } from "lucide-react";

interface DemoSamplesProps {
  onSelectSample: (text: string) => void;
}

export function DemoSamples({ onSelectSample }: DemoSamplesProps) {
  const samples = [
    {
      title: "AI不可視ゼロ幅透かし文章",
      icon: Sparkles,
      description: "ChatGPT/Claude等で埋め込まれるゼロ幅スペース(U+200B)・ZWNBSP(U+FEFF)を注入",
      getText: () =>
        "本ドキュメントは\u200B最新のAIモデルによって\u200C生成された要約レポートです。\uFEFFすべてのデータ分析は自動化されており、\u200B正確な市場予測を提供します。\u2060ご不明な点がございましたらお気軽にお問い合わせください。",
    },
    {
      title: "Unicode Tag 隠蔽ステガノグラフィ",
      icon: Tag,
      description: "不可視タグ文字 (U+E0001〜U+E007F) を利用したAIウォーターマーク埋め込み文章",
      getText: () =>
        "人工知能の発展\u{E0061}\u{E0069}\u{E002D}\u{E0067}\u{E0065}\u{E006E}により、自然言語処理技術は飛躍的に進化しました。\u{E0077}\u{E0061}\u{E0074}\u{E0065}\u{E0072}高品質なコンテンツ生成が日常的に行われています。",
    },
    {
      title: "絵文字ZWJ & 日本語異体字(IVS) 保全テスト",
      icon: Smile,
      description: "家族絵文字 👩‍👩‍👧‍👦 や 葛󠄀・辻󠄀 の正当文字を破壊せず、悪意ある透かしのみ除去する検証用",
      getText: () =>
        "こんにちは！家族旅行 👩‍👩‍👧‍👦 \u200Bの計画を立てました。\u200C葛󠄀城市と辻󠄀堂へ行きます！\uFEFF虹 🏳️‍🌈 の写真も撮影できました。",
    },
  ];

  return (
    <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-800/80">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          ワンクリックでお試しテスト用サンプル
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {samples.map((sample, idx) => {
          const Icon = sample.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSample(sample.getText())}
              className="text-left p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/40 transition-all duration-200 group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-medium text-slate-200 group-hover:text-emerald-300">
                  {sample.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {sample.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
