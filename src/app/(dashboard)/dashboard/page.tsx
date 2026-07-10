"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Coins02Icon,
  Key01Icon,
  MoneyAdd01Icon,
  Notification01Icon,
  PlusSignIcon,
  UserAdd01Icon,
  UserGroupIcon,
  Wallet01Icon,
} from "hugeicons-react";
import Link from "next/link";
import { useState } from "react";
import { AppBar } from "@/components/layout/app-bar";
import { JoinByCodeDialog } from "@/components/circles/join-by-code-dialog";
import { CircleCard, type CircleData } from "@/components/shared/circle-card";
import { WalletCard } from "@/components/shared/wallet-card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatNaira, timeAgo } from "@/lib/utils";
import type { ActivityItem } from "@/types";

export default function DashboardPage() {
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

const iconMap: Record<string, { icon: React.ReactNode; bg: string }> = {
  contribution: {
    icon: <Coins02Icon className="size-6" />,
    bg: "bg-primary text-foreground",
  },
  payout: {
    icon: <MoneyAdd01Icon className="size-6" />,
    bg: "bg-foreground text-primary",
  },
  circle_join: {
    icon: <UserAdd01Icon className="size-6" />,
    bg: "bg-foreground text-primary",
  },
  circle_create: {
    icon: <UserGroupIcon className="size-6" />,
    bg: "bg-foreground text-primary",
  },
  topup: {
    icon: <Coins02Icon className="size-6" />,
    bg: "bg-primary text-foreground",
  },
  withdrawal: {
    icon: <Wallet01Icon className="symbol-width" />,
    bg: "bg-foreground text-primary",
  },
};

// Live activity types are prefixed with `wallet_` (e.g. `wallet_topup`); the
// mock returns the bare type. Normalize so both resolve, and fall back to a
// default icon for any unknown type instead of crashing on `meta.bg`.
const activityIconFallback = {
  icon: <Notification01Icon className="symbol-width" />,
  bg: "bg-primary text-foreground",
};
function activityMeta(type: string) {
  const key = type.startsWith("wallet_") ? type.slice("wallet_".length) : type;
  return iconMap[key as ActivityItem["type"]] ?? activityIconFallback;
}

  const { data: walletRes, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.wallet.get(),
  });

  const { data: circlesRes, isLoading: circlesLoading } = useQuery({
    queryKey: ["circles"],
    queryFn: () => api.circles.list(),
  });

  const { data: activityRes, isLoading: activityLoading } = useQuery({
    queryKey: ["activity"],
    queryFn: () => api.activity.list(),
  });

  const balance = walletRes?.data?.balanceKobo ?? 0;
  const circleList = (circlesRes?.data?.circles ?? []) as CircleData[];
  const activityItems = activityRes?.data?.items ?? [];

  // T120: accumulated outstanding debt across all the user's circles.
  const totalDebt = circleList.reduce(
    (sum, c) => sum + (c.debtAmountKobo ?? 0),
    0,
  );

  return (
    <div className="relative flex flex-col gap-6">
      <AppBar />
      {walletLoading ? (
        <Skeleton className="h-44 rounded-xl" />
      ) : (
        <WalletCard balance={balance} />
      )}

      {totalDebt > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive/80">
            Outstanding debt
          </p>
          <p className="font-heading text-lg font-bold text-destructive">
            {formatNaira(totalDebt)}
          </p>
        </div>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Active Circles</h2>
          <Link
            href="/circles/new"
            className="text-xs font-bold uppercase tracking-wider text-primary"
          >
            Create
          </Link>
        </div>

        {circlesLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : circleList.length > 0 ? (
          <div className="flex flex-col gap-4">
            {circleList.map((circle) => (
              <CircleCard key={circle.id} circle={circle} />
            ))}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="default">
                <img
                  src="/illustrations/circles.svg"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-40 object-contain"
                />
              </EmptyMedia>
              <EmptyDescription>
                No circles yet. Create or join one to start saving.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" onClick={() => setJoinDialogOpen(true)}>
                  <Key01Icon data-icon="inline-start" />
                  Join with code
                </Button>
                <Link href="/circles/new">
                  <Button size="sm">
                    <PlusSignIcon data-icon="inline-start" />
                    Create Circle
                  </Button>
                </Link>
              </div>
            </EmptyContent>
          </Empty>
        )}
      </section>

      <Separator />

      <section>
        <h2 className="mb-4 text-lg font-bold">Recent Activity</h2>

        {activityLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : activityItems.length > 0 ? (
          <ItemGroup className="bg-card gap-0! py-2">
            {activityItems.map((item, i) => {
              const meta = activityMeta(item.type);
              return (
                <div key={item.id}>
                  <ItemSeparator className={i === 0 ? "hidden" : ""} />
                  <Item variant="muted" size="xs">
                    <ItemMedia
                      variant="icon"
                      className={`symbol-container ${meta.bg} p-0!`}
                    >
                      {meta.icon}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="line-clamp-1">
                        {item.description}
                      </ItemTitle>
                      <ItemDescription className="line-clamp-1">
                        {timeAgo(item.createdAt)}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                </div>
              );
            })}
          </ItemGroup>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="default">
                <img
                  src="/illustrations/no-data.svg"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-32 object-contain"
                />
              </EmptyMedia>
              <EmptyDescription>
                No activity yet. Join or create a circle to get started.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        </section>

      <JoinByCodeDialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen} />
    </div>
  );
}
