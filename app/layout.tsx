import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "Watermark Remover - AI電子透かし・メタデータ除去 SaaS",
  description: "AI生成テキストの不可視文字・ゼロ幅透かし、画像・文書のC2PA/EXIF/XMPメタデータを高精度に検査・決定論的除去するプライバシー重視ツール。",
  keywords: ["AI透かし除去", "C2PA除去", "ゼロ幅文字削除", "EXIF削除", "watermarks-remover", "AI metadata cleaner"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WatermarkRemover",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#090d16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
