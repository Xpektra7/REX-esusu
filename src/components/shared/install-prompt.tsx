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

  useEffect(() => {
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

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setState("installed");
    }
    setDeferredPrompt(null);
  };

  if (state === "installed") return null;

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary">
        <SmartPhone01Icon className="size-6 text-primary-foreground" />
      </div>
      {state === "promptable" && (
        <>
          <h3 className="text-lg font-semibold">Get Esusu on your phone</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Install as an app for the best experience — fast, works offline,
            push notifications included.
          </p>
          <Button size="lg" onClick={handleInstall} className="font-bold">
        </>
      )}
      {state === "ios" && (
        <>
          <h3 className="text-lg font-semibold">Install on iPhone</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tap Share{" "}
            <span className="inline-block text-base leading-none">↑</span> then
            scroll down and tap <strong>Add to Home Screen</strong>.
          </p>
        </>
      )}
      {state === "unsupported" && (
        <>
          <h3 className="text-lg font-semibold">Use Esusu on any device</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Works in your browser. For the best experience, open this page in
            Chrome or Edge on Android.
          </p>
        </>
      )}
    </div>
  );
}
