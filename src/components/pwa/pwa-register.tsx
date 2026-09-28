"use client";

import * as React from "react";
import { WifiOff, Download } from "lucide-react";

export function PwaRegister() {
  const [isOffline, setIsOffline] = React.useState(false);
  const [installPrompt, setInstallPrompt] = React.useState<Event | null>(null);

  React.useEffect(() => {
    // Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Pabulong PWA Service Worker active with scope:", registration.scope);
          })
          .catch((error) => {
            console.warn("PWA Service Worker registration warning:", error);
          });
      });
    }

    // Monitor Online/Offline Status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Capture beforeinstallprompt for PWA install button
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setTimeout(() => setIsOffline(true), 0);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPrompt && "prompt" in installPrompt) {
      (installPrompt as { prompt: () => void }).prompt();
      setInstallPrompt(null);
    }
  };

  return (
    <>
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 bg-amber-500/90 text-slate-950 font-semibold px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md text-xs animate-in slide-in-from-bottom-2">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>Offline Mode Active — Notes & Properties served from cache.</span>
        </div>
      )}

      {/* PWA Install Button Floating Badge */}
      {installPrompt && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-indigo-500/30 transition-all border border-indigo-400/30"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install App</span>
          </button>
        </div>
      )}
    </>
  );
}
