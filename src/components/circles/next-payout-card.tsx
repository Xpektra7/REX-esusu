"use client";

import { formatNaira } from "@/lib/utils";

interface NextPayoutCardProps {
  daysLeft: number | null;
  payoutAmount: number;
}

export function NextPayoutCard({
  daysLeft,
  payoutAmount,
}: NextPayoutCardProps) {
  if (daysLeft === null) return null;

  return (
    <div className="rounded-xl bg-card px-4 py-3">
      <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        Next Payout
      </span>
      <div className="mt-1 flex items-center justify-between">
        <p className="text-sm font-medium">
          {daysLeft === 0
            ? "Due today"
            : `${daysLeft} day${daysLeft > 1 ? "s" : ""} remaining`}
        </p>
        <span className="font-heading text-sm font-bold">
          {formatNaira(payoutAmount)}
        </span>
      </div>
    </div>
  );
}
