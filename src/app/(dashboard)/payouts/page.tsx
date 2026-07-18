"use client";

import { useQuery } from "@tanstack/react-query";
import { Coins02Icon } from "hugeicons-react";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn, formatNaira, formatDate } from "@/lib/utils";
import type { Payout, PayoutStatus } from "@/types";

const PAYOUT_STATUS_META: Record<PayoutStatus, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-primary/10 text-primary" },
  initiated: { label: "Initiated", className: "bg-foreground/10 text-foreground" },
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
};

export default function PayoutsPage() {
  const { data: res, isLoading } = useQuery({
    queryKey: ["payouts"],
    queryFn: () => api.payouts.history(),
    refetchInterval: 5_000,
  });

  const payouts = ((res?.data as { payouts: Payout[] } | undefined)
    ?.payouts ?? []) as Payout[];

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Payouts" },
        ]}
      />

      <div>
        <h1 className="text-xl font-bold">Payout History</h1>
        <p className="text-xs text-muted-foreground">
          Payments you&apos;ve received from circles
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : payouts.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="default">
              <img
                src="/illustrations/empty-wallet.svg"
                alt=""
                loading="lazy"
                decoding="async"
                className="size-32 object-contain"
              />
            </EmptyMedia>
            <EmptyDescription>No payouts received yet.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ItemGroup className="gap-0! py-2 bg-card">
          {payouts.map((p, i) => {
            const meta = PAYOUT_STATUS_META[p.status] ?? PAYOUT_STATUS_META.pending;
            return (
              <div key={p.id}>
                <ItemSeparator className={i === 0 ? "hidden" : ""} />
                <Item variant="muted" size="sm">
                  <ItemMedia
                    variant="icon"
                    className={cn("symbol-container p-0!", meta.className)}
                  >
                    <Coins02Icon className="symbol-width" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{p.circleName}</ItemTitle>
                    <ItemDescription>
                      Cycle {p.cycleNumber} &middot;{" "}
                      {formatDate(p.createdAt)}
                    </ItemDescription>
                  </ItemContent>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-heading text-sm font-bold">
                      {formatNaira(p.amountKobo)}
                    </span>
                    <span
                      className={cn(
                        "inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wider",
                        meta.className,
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>
                </Item>
              </div>
            );
          })}
        </ItemGroup>
      )}
    </div>
  );
}
