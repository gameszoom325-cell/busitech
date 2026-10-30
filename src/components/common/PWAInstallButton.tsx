import React, { useEffect, useState } from "react";
import { Download, WifiOff, Database, RefreshCw } from "lucide-react";
import { useContractCache } from "../../hooks/useContractCache";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (isInstalled || !deferredPrompt) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-xs font-semibold text-[var(--color-text-main)] transition-colors cursor-pointer min-h-[36px]"
      title="Install Contract2Action AI for Offline Access"
    >
      <Download className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
      <span>Install App</span>
    </button>
  );
};

export const OfflineCacheBanner: React.FC = () => {
  const {
    isOfflineMode,
    isSimulatedOffline,
    cacheSource,
    contracts,
    toggleSimulatedOffline,
    syncContractCache,
  } = useContractCache();

  if (!isOfflineMode) return null;

  return (
    <div className="bg-[var(--color-warning-bg)] border-b border-[var(--color-warning-border)] text-[var(--color-warning-text)] px-3 sm:px-5 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-2 font-medium min-w-0">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span className="truncate">
          <strong>Offline / Backend Interrupted Mode:</strong> Viewing{" "}
          {contracts.length} cached contract summaries via{" "}
          <span className="font-mono font-bold">{cacheSource}</span> cache.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isSimulatedOffline ? (
          <button
            type="button"
            onClick={() => toggleSimulatedOffline(false)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--color-bg-card)] text-[var(--color-text-main)] border border-[var(--color-border)] font-semibold text-[11px] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-[var(--color-primary)]" />
            <span>Reconnect Backend</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => syncContractCache(false)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--color-bg-card)] text-[var(--color-text-main)] border border-[var(--color-border)] font-semibold text-[11px] hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer"
          >
            <Database className="w-3 h-3 text-[var(--color-primary)]" />
            <span>Retry Sync</span>
          </button>
        )}
      </div>
    </div>
  );
};
