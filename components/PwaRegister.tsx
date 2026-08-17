"use client";

import React, { useEffect, useState } from "react";
import { Download, Smartphone, Check } from "lucide-react";

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registered successfully with scope: ", reg.scope);
          })
          .catch((err) => {
            console.error("Service Worker registration failed: ", err);
          });
      });
    }

    // Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if app is already running as standalone PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (!isInstallable || isInstalled) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce">
      <button
        type="button"
        onClick={handleInstallClick}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white font-semibold text-xs shadow-2xl shadow-emerald-500/30 border border-emerald-500/40 hover:border-emerald-400 transition-all hover:scale-105 active:scale-95 group"
      >
        <img src="/icons/icon-192x192.png" alt="App Icon" className="w-5 h-5 rounded-lg shadow-sm" />
        <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-white bg-clip-text text-transparent font-bold">
          ホーム画面に追加（PWA）
        </span>
      </button>
    </div>
  );
}
