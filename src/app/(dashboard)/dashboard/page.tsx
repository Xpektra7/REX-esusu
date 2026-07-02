"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { WalletCard } from "@/components/shared/wallet-card";
import { CircleCard, type CircleData } from "@/components/shared/circle-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { PlusSignIcon } from "hugeicons-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: walletRes, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.wallet.get(),
  });

  const { data: circlesRes, isLoading: circlesLoading } = useQuery({
    queryKey: ["circles"],
    queryFn: () => api.circles.list(),
  });

  const balance = walletRes?.data?.balance ?? 0;
  const circleList = (circlesRes?.data ?? []) as CircleData[];

  return (
    <div className="flex flex-col gap-6">
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
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border p-8 text-center">
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
        <p className="text-sm text-muted-foreground">
          No activity yet. Join or create a circle to get started.
        </p>
      </section>
    </div>
  );
}
