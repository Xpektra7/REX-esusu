"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import type { UserSettings } from "@/types";

interface NotificationPreferencesProps {
  settings: UserSettings;
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-1">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
          on ? "bg-primary" : "bg-muted"
        }`}
        role="switch"
        aria-checked={on}
      >
        <span
          className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
            on ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

export function NotificationPreferences({
  settings,
}: NotificationPreferencesProps) {
  const [prefs, setPrefs] = useState(settings);

  const update = async (patch: Partial<UserSettings>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      await api.users.settings.update(patch);
    } catch {
      setPrefs(prefs);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Toggle
        label="Push notifications"
        on={prefs.pushEnabled}
        onChange={(v) => update({ pushEnabled: v })}
      />

      {prefs.pushEnabled && (
        <>
          <Separator />

          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Reminder Timing
          </p>
          <Toggle
            label="24 hours before deadline"
            on={prefs.reminder24h}
            onChange={(v) => update({ reminder24h: v })}
          />
          <Toggle
            label="6 hours before deadline"
            on={prefs.reminder6h}
            onChange={(v) => update({ reminder6h: v })}
          />
          <Toggle
            label="At deadline"
            on={prefs.reminderDeadline}
            onChange={(v) => update({ reminderDeadline: v })}
          />
          <Toggle
            label="After grace expires"
            on={prefs.reminderGraceExpiry}
            onChange={(v) => update({ reminderGraceExpiry: v })}
          />

          <Separator />

          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Notification Types
          </p>
          <Toggle
            label="Payment received"
            on={prefs.notifyPaymentReceived}
            onChange={(v) => update({ notifyPaymentReceived: v })}
          />
          <Toggle
            label="Debt cleared"
            on={prefs.notifyDebtCleared}
            onChange={(v) => update({ notifyDebtCleared: v })}
          />
          <Toggle
            label="Cycle reminders"
            on={prefs.notifyCycleReminders}
            onChange={(v) => update({ notifyCycleReminders: v })}
          />
          <Toggle
            label="Payout sent / received"
            on={prefs.notifyPayout}
            onChange={(v) => update({ notifyPayout: v })}
          />
          <Toggle
            label="Default alerts"
            on={prefs.notifyDefaultAlert}
            onChange={(v) => update({ notifyDefaultAlert: v })}
          />
          <Toggle
            label="Circle invites"
            on={prefs.notifyCircleInvite}
            onChange={(v) => update({ notifyCircleInvite: v })}
          />
          <Toggle
            label="Trust score changes"
            on={prefs.notifyTrustScore}
            onChange={(v) => update({ notifyTrustScore: v })}
          />
          <Toggle
            label="Withdrawal status"
            on={prefs.notifyWithdrawal}
            onChange={(v) => update({ notifyWithdrawal: v })}
          />
        </>
      )}
    </div>
  );
}
