"use client";

import { Badge } from "@/components/ui/badge";
import { DiceBearAvatar } from "@/components/shared/dicebear-avatar";
import { ContributionStatusBadge } from "@/components/circles/status-badge";
import { formatNaira } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ContributionRowProps {
  memberName: string;
  amountKobo: number;
  status: "paid" | "pending" | "defaulted";
  paidAt?: string;
  isRecipient: boolean;
}

export function ContributionRow({
  memberName,
  amountKobo,
  status,
  paidAt,
  isRecipient,
}: ContributionRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl bg-card px-4 py-3",
        isRecipient
          ? "border border-primary/50 bg-primary/10"
          : "border-border",
      )}
    >
      <div className="flex items-center gap-3">
        <DiceBearAvatar name={memberName} />
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium">{memberName}</p>
            {isRecipient && (
              <Badge
                variant="outline"
                className="h-4 border-primary/40 px-1.5 py-0 text-[9px] text-primary"
              >
                Recipient
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatNaira(amountKobo)}
            {paidAt && (
              <>
                {" · "}
                {new Date(paidAt).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                })}
              </>
            )}
          </p>
        </div>
      </div>
      <ContributionStatusBadge status={status} />
    </div>
  );
}
