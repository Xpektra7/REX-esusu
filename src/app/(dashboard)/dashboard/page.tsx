"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Coins02Icon,
  MoneyAdd01Icon,
  PlusSignIcon,
  UserAdd01Icon,
  UserGroupIcon,
} from "hugeicons-react";
import Link from "next/link";
import { CircleCard, type CircleData } from "@/components/shared/circle-card";
import { WalletCard } from "@/components/shared/wallet-card";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { AppBar } from "@/components/layout/app-bar";
import type { ActivityItem } from "@/types";

const iconMap: Record<
  ActivityItem["type"],
  { icon: React.ReactNode; bg: string }
> = {
  contribution: {
    icon: <Coins02Icon className="size-4" />,
    bg: "bg-primary text-foreground",
  },
  payout: {
    icon: <MoneyAdd01Icon className="size-4" />,
    bg: "bg-foreground text-primary",
  },
  circle_join: {
    icon: <UserAdd01Icon className="size-4" />,
    bg: "bg-foreground text-primary",
  },
  circle_create: {
    icon: <UserGroupIcon className="size-4" />,
    bg: "bg-foreground text-primary",
  },
  topup: {
    icon: <Coins02Icon className="size-4" />,
    bg: "bg-primary text-foreground",
  },
};

export default function DashboardPage() {
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

  return (
    <div className="relative flex flex-col gap-6">
      <AppBar />
      {walletLoading ? (
        <Skeleton className="h-44 rounded-xl" />
      ) : (
        <WalletCard balance={balance} />
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
              <Link href="/circles/new">
                <Button size="sm">
                  <PlusSignIcon data-icon="inline-start" />
                  Create Circle
                </Button>
              </Link>
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
          <ItemGroup>
            {activityItems.map((item) => {
              const meta = iconMap[item.type];
              return (
                <Item
                  key={item.id}
                  variant="muted"
                  size="sm"
                  className="hover:border-primary"
                >
                  <ItemMedia
                    variant="icon"
                    className={`rounded-full size-9 ${meta.bg}`}
                  >
                    {meta.icon}
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{item.description}</ItemTitle>
                    <ItemDescription>{timeAgo(item.createdAt)}</ItemDescription>
                  </ItemContent>
                </Item>
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
    </div>
  );
}
