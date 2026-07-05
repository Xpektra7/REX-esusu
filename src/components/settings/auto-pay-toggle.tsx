"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface AutoPayToggleProps {
  enabled: boolean;
}

export function AutoPayToggle({ enabled }: AutoPayToggleProps) {
  const [on, setOn] = useState(enabled);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    setSaving(true);
    try {
      await api.users.settings.update({ autoPay: !on });
      setOn(!on);
    } catch {
      // silently revert
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Auto-pay</p>
        <p className="text-xs text-muted-foreground">
          Auto-debit from wallet when contribution is due
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
          on ? "bg-primary" : "bg-muted"
        }`}
        role="switch"
        aria-checked={on}
      >
        <span
          className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
            on ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
