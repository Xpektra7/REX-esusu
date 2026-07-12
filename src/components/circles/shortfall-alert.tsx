"use client";

import { AlertCircleIcon } from "hugeicons-react";
import { formatNaira } from "@/lib/utils";

interface ShortfallAlertProps {
  shortfall: number;
  pendingCount: number;
  defaultedCount: number;
}

export function ShortfallAlert({
  shortfall,
  pendingCount,
  defaultedCount,
}: ShortfallAlertProps) {
  if (shortfall <= 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3">
      <AlertCircleIcon className="mt-0.5 symbol-width shrink-0 text-foreground" />
      <div>
        <p className="text-sm font-semibold text-foreground">
          {pendingCount + defaultedCount > 0
            ? `${pendingCount + defaultedCount} Pending Contribution${pendingCount + defaultedCount > 1 ? "s" : ""}`
            : "Shortfall Detected"}
        </p>
        <p className="text-xs text-foreground/70">
          {formatNaira(shortfall)} outstanding
          {defaultedCount > 0 && " — default(s) may need resolution"}
        </p>
      </div>
    </div>
  );
}
