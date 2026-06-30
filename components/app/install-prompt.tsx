"use client";

import { Download } from "lucide-react";
import { useCallback, useEffect, useSyncExternalStore, useState } from "react";

function useIsStandalone() {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia("(display-mode: standalone)");
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia("(display-mode: standalone)").matches,
    () => false,
  );
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  const isStandalone = useIsStandalone();
  const isIOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    (deferredPrompt as Event & { prompt: () => Promise<void> }).prompt();
    const result = await (
      deferredPrompt as Event & { userChoice: Promise<{ outcome: string }> }
    ).userChoice;
    setInstalling(false);
    if (result.outcome === "accepted") {
      setInstalled(true);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  if (isStandalone || dismissed || installed) {
    return null;
  }

  if (isIOS) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="mx-auto flex max-w-lg items-center gap-3 rounded-t-2xl border border-border bg-card px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-ff-lg">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ff-lg bg-ff-primary-soft">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">FamilyFinance no celular</p>
            <p className="text-xs text-muted-foreground">Compartilhe e escolha &ldquo;Adicionar à Tela de Início&rdquo;</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-ff-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-t-2xl border border-border bg-card px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-ff-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ff-lg bg-ff-primary-soft">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Instalar FamilyFinance</p>
          <p className="text-xs text-muted-foreground">Adicione à tela inicial do seu celular</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-ff-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Agora não
          </button>
          <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            className="rounded-ff-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-ff-primary-hover disabled:opacity-50"
          >
            {installing ? "Instalando..." : "Instalar"}
          </button>
        </div>
      </div>
    </div>
  );
}
