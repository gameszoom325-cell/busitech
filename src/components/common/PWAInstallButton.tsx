import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";

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
