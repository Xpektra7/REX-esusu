"use client";

import { Card } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";

interface ReportSummaryCardsProps {
  totalContributionsKobo: number;
  totalPayoutsKobo: number;
  defaultRate: number;
  members: number;
}

export function ReportSummaryCards({
  totalContributionsKobo,
  totalPayoutsKobo,
  defaultRate,
  members,
}: ReportSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="flex flex-col gap-1 p-4">
        <span className="text-xs text-muted-foreground">
          Total Contributions
        </span>
        <span className="font-heading text-lg font-bold">
          {formatNaira(totalContributionsKobo)}
        </span>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <span className="text-xs text-muted-foreground">Total Payouts</span>
        <span className="font-heading text-lg font-bold">
          {formatNaira(totalPayoutsKobo)}
        </span>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <span className="text-xs text-muted-foreground">Default Rate</span>
        <span className="font-heading text-lg font-bold">{defaultRate}%</span>
      </Card>
      <Card className="flex flex-col gap-1 p-4">
        <span className="text-xs text-muted-foreground">Members</span>
        <span className="font-heading text-lg font-bold">{members}</span>
      </Card>
    </div>
  );
}
