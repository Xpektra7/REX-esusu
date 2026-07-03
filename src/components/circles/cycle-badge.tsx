"use client";

import { CYCLE_STATUS } from "@/lib/status";
import { cn } from "@/lib/utils";

export function CycleBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider",
        CYCLE_STATUS[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status === "paid_out"
        ? "Paid Out"
        : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
