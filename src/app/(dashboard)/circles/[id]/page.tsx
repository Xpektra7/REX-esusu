"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircleIcon, Settings01Icon } from "hugeicons-react";
import Link from "next/link";
import { use, useState } from "react";
import { toast } from "sonner";
import { CircleActions } from "@/components/circles/circle-actions";
import { HeroPotCard } from "@/components/circles/hero-pot-card";
import { MemberList } from "@/components/circles/member-list";
import { NextPayoutCard } from "@/components/circles/next-payout-card";
import { ActionPinDialog } from "@/components/shared/action-pin-dialog";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { daysUntil, formatNaira } from "@/lib/utils";
import type { CirclePageData } from "@/types";

export default function CircleDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);

  const { data: res, isLoading } = useQuery({
    queryKey: ["circle", id],
    queryFn: () => api.circles.get(id),
  });
  const queryClient = useQueryClient();

  const circle = res?.data as CirclePageData | undefined;

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

  const [contributePinOpen, setContributePinOpen] = useState(false);
  const [contribution, setContribution] = useState<{
    ourReference: string;
    amountKobo: number;
  } | null>(null);

  const contributeMutation = useMutation({
    mutationFn: () => {
      if (!circle) throw new Error("Circle not loaded");
      return api.contributions.initiate({
        circleId: circle.id,
        cycleNumber: circle.currentCycle,
        amountKobo: circle.contributionAmount,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["circle", id] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      setContribution(res.data);
      setContributePinOpen(false);
      toast.success("Contribution recorded");
    },
    onError: (err: Error) => toast.error(err.message),
  });

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
        <AlertCircleIcon className="symbol-width text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Circle not found.</p>
        <Link href="/circles">
          <button
            type="button"
            className="rounded-lg card-interactive px-4 py-2 text-sm"
          >
            Back to Circles
          </button>
        </Link>
      </div>
    );
  }

  const members = circle.members ?? [];
  const totalPot = circle.contributionAmount * members.length;
  const progress =
    circle.cycleCount != null && circle.cycleCount > 0
      ? (circle.currentCycle / circle.cycleCount) * 100
      : 50;
  const daysLeft = circle.deadlineAt ? daysUntil(circle.deadlineAt) : null;
  const isAdmin = circle.role === "admin";

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
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href={`/circles/${id}/settings`}
              className="symbol-container bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <Settings01Icon className="symbol-width" />
            </Link>
          )}
          <Badge variant={circle.status === "active" ? "default" : "outline"}>
            {circle.status.charAt(0).toUpperCase() + circle.status.slice(1)}
          </Badge>
        </div>
      </div>
      <HeroPotCard
        totalPot={totalPot}
        progress={progress}
        currentCycle={circle.currentCycle}
        cycleCount={circle.cycleCount}
        contributionAmount={circle.contributionAmount}
        frequency={circle.frequency}
        memberCount={members.length}
      />

      {circle.status === "active" && circle.currentCycleId && (
        <div className="rounded-xl bg-card px-4 py-3">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Your Contribution
          </span>
          <div className="mt-1 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {formatNaira(circle.contributionAmount)} this cycle
              </p>
              {circle.totalContributedKobo ? (
                <p className="text-xs text-muted-foreground">
                  {formatNaira(circle.totalContributedKobo)} contributed so far
                </p>
              ) : null}
            </div>
            {circle.userContributedThisCycle ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Contributed ✓
              </span>
            ) : (
              <Button
                onClick={() => setContributePinOpen(true)}
                disabled={contributeMutation.isPending}
              >
                {contributeMutation.isPending
                  ? "Processing..."
                  : "Contribute Now"}
              </Button>
            )}
          </div>
        </div>
      )}

      <NextPayoutCard daysLeft={daysLeft} payoutAmount={totalPot} />

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

      <ActionPinDialog
        open={contributePinOpen}
        onOpenChange={setContributePinOpen}
        onSuccess={() => contributeMutation.mutate()}
      />

      {contribution && (
        <Dialog
          open
          onOpenChange={(o) => {
            if (!o) setContribution(null);
          }}
        >
          <DialogContent className="sm:max-w-sm w-fit">
            <DialogHeader>
              <DialogTitle>Contribution recorded</DialogTitle>
              <DialogDescription>
                {formatNaira(contribution.amountKobo)} has been deducted from
                your wallet. Keep your reference below for your records.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-2 text-sm">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Amount
                </p>
                <p className="font-medium">
                  {formatNaira(contribution.amountKobo)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Reference
                </p>
                <p className="break-all font-mono text-xs">
                  {contribution.ourReference}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setContribution(null)}
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
