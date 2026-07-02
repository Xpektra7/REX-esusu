"use client";

import { formatNaira } from "@/lib/utils";

interface RecipientHeroCardProps {
  recipientName: string;
  expectedTotal: number;
  actualTotal: number;
  progress: number;
}

export function RecipientHeroCard({
  recipientName,
  expectedTotal,
  actualTotal,
  progress,
}: RecipientHeroCardProps) {
  return (
    <section className="relative overflow-hidden rounded-xl bg-primary p-5">
      <div className="relative z-10 flex flex-col gap-3">
        <span className="text-[10px] font-semibold tracking-[0.05em] text-card-foreground/70 uppercase">
          {recipientName} is receiving
        </span>
        <span className="font-heading text-3xl font-bold text-card-foreground">
          {formatNaira(expectedTotal)}
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
              {formatNaira(actualTotal)} collected
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
