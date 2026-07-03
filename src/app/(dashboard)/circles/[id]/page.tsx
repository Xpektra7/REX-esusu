"use client";

import { use } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { MemberList } from "@/components/circles/member-list";
import { HeroPotCard } from "@/components/circles/hero-pot-card";
import { NextPayoutCard } from "@/components/circles/next-payout-card";
import { CircleActions } from "@/components/circles/circle-actions";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { daysUntil } from "@/lib/utils";
import type { CirclePageData } from "@/types";
import { AlertCircleIcon } from "hugeicons-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CircleDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);

  const { data: res, isLoading } = useQuery({
    queryKey: ["circle", id],
    queryFn: () => api.circles.get(id),
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.circles.invite(id),
    onSuccess: (res: unknown) => {
      const code =
        (res as { data?: { inviteCode?: string } })?.data?.inviteCode ??
        "ESUSU-XYZ";
      navigator.clipboard.writeText(code);
      toast.success(`Invite code copied: ${code}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const circle = res?.data as CirclePageData | undefined;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-1/3 rounded" />
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircleIcon className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Circle not found.</p>
        <Link href="/circles">
          <button className="rounded-lg border border-border px-4 py-2 text-sm">
            Back to Circles
          </button>
        </Link>
      </div>
    );
  }

  const members = circle.members ?? [];
  const totalPot = circle.contributionAmount * members.length;
  const progress =
    circle.cycleCount > 0
      ? (circle.currentCycle / circle.cycleCount) * 100
      : 0;
  const daysLeft = circle.deadlineAt ? daysUntil(circle.deadlineAt) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Circles", href: "/circles" },
          { label: circle.name },
        ]}
      />
      <div className="flex items-center gap-2 justify-between">
        <h1 className="text-2xl font-bold">{circle.name}</h1>
        <Badge variant={circle.status === "active" ? "default" : "outline"}>
          {circle.status.charAt(0).toUpperCase() + circle.status.slice(1)}
        </Badge>
      </div>
      <HeroPotCard
        totalPot={totalPot}
        progress={progress}
        currentCycle={circle.currentCycle}
        cycleCount={circle.cycleCount}
        contributionAmount={circle.contributionAmount}
        frequency={circle.frequency}
      />

      <NextPayoutCard
        daysLeft={2}
        payoutAmount={totalPot / circle.cycleCount}
      />

      <Separator />
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wider">
            Circle Members ({members.length})
          </h2>
          <span className="text-xs text-muted-foreground">
            {members.filter((m) => m.status === "active").length} active
          </span>
        </div>
        <MemberList members={members} />
      </section>
      <Separator />
      <CircleActions
        id={id}
        onInvite={() => inviteMutation.mutate()}
        isPending={inviteMutation.isPending}
      />
    </div>
  );
}
