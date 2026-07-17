"use client";

import { memo } from "react";
import { formatNaira, rotationLabel } from "@/lib/utils";

interface HeroPotCardProps {
  totalPot: number;
  progress: number;
  currentCycle: number;
  cycleCount: number | null;
  contributionAmount: number;
  frequency: string;
  memberCount: number;
}

export const HeroPotCard = memo(function HeroPotCard({
  totalPot,
  progress,
  currentCycle,
  cycleCount,
  contributionAmount,
  frequency,
  memberCount,
}: HeroPotCardProps) {
  const rl = rotationLabel(currentCycle, cycleCount, memberCount);
  return (
    <section className="relative overflow-clip rounded-xl bg-foreground">
      <div className="w-full bg-primary rounded-b-xl flex flex-col gap-3 p-5">
        <span className="text-[10px] font-semibold tracking-wider text-card-foreground/70 uppercase">
          Total Pot
        </span>
        <span className="font-heading text-3xl font-bold text-card-foreground">
          {formatNaira(totalPot)}
        </span>

        <div className="flex flex-col gap-1">
          <div className="h-1.5 w-full rounded-full bg-card-foreground/20">
            <div
              className="h-full rounded-full bg-card-foreground transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-card-foreground/70">
            <span className="font-semibold tracking-wider uppercase">
              Rotation {rl.rotation}{rl.totalRotations !== null ? ` of ${rl.totalRotations}` : ""} · Round {rl.round}{" "}
              of {memberCount}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
      <div className="flex items-center p-3 px-4 justify-between">
        <p className="text-xs text-card">{formatNaira(contributionAmount)}</p>
        <p className="text-xs text-primary capitalize">{frequency}</p>
      </div>
    </section>
  );
});
