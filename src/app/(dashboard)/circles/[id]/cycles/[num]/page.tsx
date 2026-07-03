"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { RecipientHeroCard } from "@/components/circles/recipient-hero-card";
import { ShortfallAlert } from "@/components/circles/shortfall-alert";
import { ContributionRow } from "@/components/circles/contribution-row";
import { CycleActions } from "@/components/circles/cycle-actions";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { formatNaira } from "@/lib/utils";
import type { CycleDetailData, CirclePageData } from "@/types";
import { AlertCircleIcon } from "hugeicons-react";
import Link from "next/link";

export default function CycleDetailPage(props: {
  params: Promise<{ id: string; num: string }>;
}) {
  const { id, num } = use(props.params);
  const cycleNum = parseInt(num, 10);

  const { data: circleRes } = useQuery({
    queryKey: ["circle", id],
    queryFn: () => api.circles.get(id),
  });

  const { data: res, isLoading } = useQuery({
    queryKey: ["circle", id, "cycle", cycleNum],
    queryFn: () => api.cycles.getByCircleAndNumber(id, cycleNum),
  });

  const circle = circleRes?.data as CirclePageData | undefined;
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
          <button className="rounded-lg border border-border px-4 py-2 text-sm">
            Back to Circle
          </button>
        </Link>
      </div>
    );
  }

  const recipient = cycle.contributions.find(
    (c) => c.memberId === cycle.recipientMemberId,
  );
  const progress =
    cycle.expectedTotalKobo > 0
      ? (cycle.actualTotalKobo / cycle.expectedTotalKobo) * 100
      : 0;
  const shortfall = cycle.expectedTotalKobo - cycle.actualTotalKobo;
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
      <PageBreadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Circles", href: "/circles" },
          { label: circle?.name ?? "Circle", href: `/circles/${id}` },
          { label: `Cycle #${cycle.cycleNumber}` },
        ]}
      />

      <h1 className="text-xl font-bold">
        Cycle #{cycle.cycleNumber} Contribution
      </h1>

      {recipient && (
        <RecipientHeroCard
          recipientName={recipient.memberName}
          expectedTotal={cycle.expectedTotalKobo}
          actualTotal={cycle.actualTotalKobo}
          progress={progress}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Contribution
          </span>
          <span className="font-heading text-lg font-bold">
            {cycle.contributions.length > 0
              ? formatNaira(cycle.contributions[0].amountKobo)
              : "—"}
          </span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Total Payout
          </span>
          <span className="font-heading text-lg font-bold">
            {formatNaira(cycle.expectedTotalKobo)}
          </span>
        </Card>
      </div>

      <ShortfallAlert
        shortfall={shortfall}
        pendingCount={pendingCount}
        defaultedCount={defaultedCount}
      />

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
            {cycle.contributions.map((c) => (
              <ContributionRow
                key={c.memberId}
                memberName={c.memberName}
                amountKobo={c.amountKobo}
                status={c.status as "paid" | "pending" | "defaulted"}
                paidAt={c.paidAt}
                isRecipient={c.memberId === cycle.recipientMemberId}
              />
            ))}
          </div>
        )}
      </section>

      <Separator />

      <CycleActions />
    </div>
  );
}
