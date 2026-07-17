"use client";

import { SmartPhone01Icon } from "hugeicons-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallState = "promptable" | "ios" | "installed" | "unsupported";

export function InstallPrompt() {
  const [state, setState] = useState<InstallState>("unsupported");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) {
      setState("installed");
      return;
    }

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setState("installed");
      return;
    }

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIos) {
      setState("ios");
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setState("promptable");
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  useEffect(() => {
    if (state === "installed") return;
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, [state]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setState("installed");
    }
    setDeferredPrompt(null);
  };

  if (state === "installed" || dismissed || !visible) return null;

  const promptText = {
    promptable: {
      title: "Get Esusu on your phone",
      desc: "Install for the best experience — fast, offline, push notifications included.",
      cta: "Install App",
    },
    ios: {
      title: "Install on iPhone",
      desc: "Tap Share ↑ then Add to Home Screen.",
      cta: null,
    },
    unsupported: {
      title: "Use Esusu on any device",
      desc: "Works in your browser. Open in Chrome on Android for install.",
      cta: null,
    },
  }[state];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background p-4 shadow-lg md:p-5">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden shrink-0 sm:flex size-10 items-center justify-center rounded-full bg-primary">
            <SmartPhone01Icon className="size-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold">{promptText.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {promptText.desc}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {promptText.cta && (
            <Button size="lg" onClick={handleInstall} className="font-bold">
              {promptText.cta}
            </Button>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
