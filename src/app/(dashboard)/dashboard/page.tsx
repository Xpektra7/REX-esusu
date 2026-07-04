"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusSignIcon } from "hugeicons-react";
import Link from "next/link";
import { CircleCard, type CircleData } from "@/components/shared/circle-card";
import { WalletCard } from "@/components/shared/wallet-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { AppBar } from "@/components/layout/app-bar";

export default function DashboardPage() {
  const { data: walletRes, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.wallet.get(),
  });

  const { data: circlesRes, isLoading: circlesLoading } = useQuery({
    queryKey: ["circles"],
    queryFn: () => api.circles.list(),
  });

  const balance = walletRes?.data?.balanceKobo ?? 0;
  const circleList = (circlesRes?.data?.circles ?? []) as CircleData[];

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
          <div className="flex flex-col h-64 items-center gap-4 rounded-xl bg-card  p-8 text-center">
            <img
              src="/illustrations/circles.svg"
              alt=""
              loading="lazy"
              decoding="async"
              className="size-40 object-contain "
            />
            <p className="text-sm text-muted-foreground">
              No circles yet. Create or join one to start saving.
            </p>
            <Link href="/circles/new">
              <Button size="sm">
                <PlusSignIcon data-icon="inline-start" />
                Create Circle
              </Button>
            </Link>
          </div>
        )}
      </section>

      <Separator />

      <section>
        <h2 className="mb-4 text-lg font-bold">Recent Activity</h2>
        <div className="flex flex-col h-64 items-center gap-4 rounded-xl bg-card  p-8 text-center">
          <img
            src="/illustrations/no-data.svg"
            alt=""
            loading="lazy"
            decoding="async"
            className="size-32 object-contain "
          />
          <p className="text-sm text-muted-foreground">
            No activity yet. Join or create a circle to get started.
          </p>
        </div>
      </section>
    </div>
  );
}
