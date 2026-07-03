"use client";

import Link from "next/link";
import { CycleBadge } from "@/components/circles/cycle-badge";
import { formatNaira } from "@/lib/utils";

interface CycleItem {
  cycleNumber: number;
  status: string;
  totalKobo: number;
  completedAt: string | null;
}

interface CycleHistoryListProps {
  cycles: CycleItem[];
  circleId: string;
}

export function CycleHistoryList({ cycles, circleId }: CycleHistoryListProps) {
  if (cycles.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No cycles completed yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {cycles.map((cycle) => (
        <Link
          key={cycle.cycleNumber}
          href={`/circles/${circleId}/cycles/${cycle.cycleNumber}`}
          className="flex items-center justify-between rounded-xl bg-card px-4 py-3 transition-colors hover:bg-primary/50"
        >
          <div>
            <p className="text-sm font-medium">Cycle #{cycle.cycleNumber}</p>
            <p className="text-xs text-muted-foreground">
              {formatNaira(cycle.totalKobo)}
              {cycle.completedAt && (
                <>
                  {" · "}
                  {new Date(cycle.completedAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </>
              )}
            </p>
          </div>
          <CycleBadge status={cycle.status} />
        </Link>
      ))}
    </div>
  );
}
