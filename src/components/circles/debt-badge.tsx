"use client";

import { DEBT_STATUS } from "@/lib/status";
import { cn } from "@/lib/utils";

export function DebtBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider",
        DEBT_STATUS[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
