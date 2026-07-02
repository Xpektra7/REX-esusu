"use client";

import { use } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberList } from "@/components/circles/member-list";
import { formatNaira, daysUntil } from "@/lib/utils";
import type { CirclePageData } from "@/types";
import {
  Copy01Icon,
  SavingsIcon,
  Calendar01Icon,
  AlertCircleIcon,
  ArrowRight01Icon,
} from "hugeicons-react";
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
        (res as { data?: { invite_code?: string } })?.data?.invite_code ??
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
          <Button variant="outline" size="sm">
            Back to Circles
          </Button>
        </Link>
      </div>
    );
  }

  const members = circle.members ?? [];
  const activeMembers = members.filter((m) => m.status === "active");
  const totalPot = circle.contribution_amount * members.length;
  const progress =
    circle.cycle_count > 0
      ? (circle.current_cycle / circle.cycle_count) * 100
      : 0;
  const daysLeft = circle.deadline_at ? daysUntil(circle.deadline_at) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/circles"
            className="text-xs tracking-wider text-muted-foreground hover:text-foreground"
          >
            &larr; All Circles
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{circle.name}</h1>
        </div>
        <Badge
          variant={circle.status === "active" ? "default" : "outline"}
        >
          {circle.status.charAt(0).toUpperCase() + circle.status.slice(1)}
        </Badge>
      </div>

      <section className="relative overflow-hidden rounded-xl bg-primary p-5">
        <div className="relative z-10 flex flex-col gap-3">
          <span className="text-[10px] font-semibold tracking-[0.05em] text-card-foreground/70 uppercase">
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
                Cycle {circle.current_cycle} of {circle.cycle_count}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          <p className="text-xs text-card-foreground/60">
            {formatNaira(circle.contribution_amount)} per member
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex items-center gap-3 p-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <SavingsIcon className="size-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
              Your Share
            </span>
            <p className="font-heading text-lg font-bold">
              {formatNaira(circle.contribution_amount)}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Calendar01Icon className="size-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
              Frequency
            </span>
            <p className="font-heading text-lg font-bold capitalize">
              {circle.frequency}
            </p>
          </div>
        </Card>
      </div>

      {daysLeft !== null && (
        <div className="rounded-xl border-l-4 border-l-primary bg-muted/50 px-4 py-3">
          <span className="text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
            Next Payout
          </span>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm font-medium">
              {daysLeft === 0
                ? "Due today"
                : `${daysLeft} day${daysLeft > 1 ? "s" : ""} remaining`}
            </p>
            <span className="font-heading text-sm font-bold">
              {formatNaira(totalPot / circle.cycle_count)}
            </span>
          </div>
        </div>
      )}

      <Separator />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Circle Members ({members.length})
          </h2>
          <span className="text-[10px] text-muted-foreground">
            {activeMembers.length} active
          </span>
        </div>
        <MemberList members={members} />
      </section>

      <Separator />

      <div className="flex flex-col gap-3">
        <Button
          className="w-full"
          onClick={() => inviteMutation.mutate()}
          disabled={inviteMutation.isPending}
        >
          <Copy01Icon className="size-4" />
          {inviteMutation.isPending ? "Generating..." : "Copy Invite Code"}
        </Button>
        <Link href={`/circles/${id}/report`}>
          <Button variant="outline" className="w-full">
            View Report
            <ArrowRight01Icon className="size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
