"use client";

import { CycleBadge } from "@/components/circles/cycle-badge";
import { formatNaira } from "@/lib/utils";
import Link from "next/link";

interface CycleItem {
  cycle_number: number;
  status: string;
  total_kobo: number;
  completed_at: string | null;
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
          key={cycle.cycle_number}
          href={`/circles/${circleId}/cycles/${cycle.cycle_number}`}
          className="flex items-center justify-between rounded-xl bg-card px-4 py-3 transition-colors hover:bg-primary/50"
        >
          <div>
            <p className="text-sm font-medium">Cycle #{cycle.cycle_number}</p>
            <p className="text-xs text-muted-foreground">
              {formatNaira(cycle.total_kobo)}
              {cycle.completed_at && (
                <>
                  {" · "}
                  {new Date(cycle.completed_at).toLocaleDateString("en-NG", {
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
