"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ContributionStatusBadge } from "@/components/circles/status-badge";
import { DiceBearAvatar } from "@/components/shared/dicebear-avatar";
import { formatNaira } from "@/lib/utils";
import type { CycleDetailData } from "@/types";
import {
  AlertCircleIcon,
  Notification03Icon,
  FileDownloadIcon,
} from "hugeicons-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CycleDetailPage(props: {
  params: Promise<{ id: string; num: string }>;
}) {
  const { id, num } = use(props.params);
  const cycleNum = parseInt(num, 10);

  const { data: res, isLoading } = useQuery({
    queryKey: ["circle", id, "cycle", cycleNum],
    queryFn: () => api.cycles.getByCircleAndNumber(id, cycleNum),
  });

  const cycle = res?.data as CycleDetailData | undefined;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-1/3 rounded" />
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircleIcon className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Cycle not found.</p>
        <Link href={`/circles/${id}`}>
          <Button variant="outline" size="sm">
            Back to Circle
          </Button>
        </Link>
      </div>
    );
  }

  const recipient = cycle.contributions.find(
    (c) => c.member_id === cycle.recipient_member_id,
  );
  const progress =
    cycle.expected_total_kobo > 0
      ? (cycle.actual_total_kobo / cycle.expected_total_kobo) * 100
      : 0;
  const shortfall = cycle.expected_total_kobo - cycle.actual_total_kobo;
  const pendingCount = cycle.contributions.filter(
    (c) => c.status === "pending",
  ).length;
  const defaultedCount = cycle.contributions.filter(
    (c) => c.status === "defaulted",
  ).length;
  const paidCount = cycle.contributions.filter(
    (c) => c.status === "paid",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/circles/${id}`}
          className="text-xs tracking-wider text-muted-foreground hover:text-foreground"
        >
          &larr; Circle
        </Link>
        <h1 className="mt-1 text-xl font-bold">
          Cycle #{cycle.cycle_number} Contribution
        </h1>
      </div>

      {recipient && (
        <section className="relative overflow-hidden rounded-xl bg-primary p-5">
          <div className="relative z-10 flex flex-col gap-3">
            <span className="text-[10px] font-semibold tracking-[0.05em] text-card-foreground/70 uppercase">
              {recipient.member_name} is receiving
            </span>
            <span className="font-heading text-3xl font-bold text-card-foreground">
              {formatNaira(cycle.expected_total_kobo)}
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
                  {formatNaira(cycle.actual_total_kobo)} collected
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
            Contribution
          </span>
          <span className="font-heading text-lg font-bold">
            {cycle.contributions.length > 0
              ? formatNaira(cycle.contributions[0].amount_kobo)
              : "—"}
          </span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
            Total Payout
          </span>
          <span className="font-heading text-lg font-bold">
            {formatNaira(cycle.expected_total_kobo)}
          </span>
        </Card>
      </div>

      {shortfall > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3">
          <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-foreground" />
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
      )}

      <div className="flex gap-3 text-center text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-primary" />
          {paidCount} paid
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-muted-foreground/30" />
          {pendingCount} pending
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-foreground" />
          {defaultedCount} defaulted
        </span>
      </div>

      <Separator />

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider">
          Member Contributions
        </h2>
        {cycle.contributions.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No contributions recorded.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {cycle.contributions.map((c) => {
              const isRecipient =
                c.member_id === cycle.recipient_member_id;
              return (
                <div
                  key={c.member_id}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3",
                    isRecipient
                      ? "border-primary/30 bg-primary/5"
                      : "border-border",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <DiceBearAvatar name={c.member_name} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium">
                          {c.member_name}
                        </p>
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
                        {formatNaira(c.amount_kobo)}
                        {c.paid_at && (
                          <>
                            {" · "}
                            {new Date(c.paid_at).toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                            })}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <ContributionStatusBadge status={c.status} />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Separator />

      <div className="flex flex-col gap-3">
        <Button className="w-full">
          <Notification03Icon className="size-4" />
          Remind Pending Members
        </Button>
        <Button variant="outline" className="w-full">
          <FileDownloadIcon className="size-4" />
          Download Cycle Report
        </Button>
      </div>
    </div>
  );
}
