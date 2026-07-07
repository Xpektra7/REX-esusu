"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft01Icon } from "hugeicons-react";
import Link from "next/link";
import { use, useState } from "react";
import { toast } from "sonner";
import { ActionPinDialog } from "@/components/shared/action-pin-dialog";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { CirclePageData } from "@/types";

export default function CircleSettingsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);
  const queryClient = useQueryClient();
  const [pinDialogOpen, setPinDialogOpen] = useState(false);

  const { data: res, isLoading } = useQuery({
    queryKey: ["circle", id],
    queryFn: () => api.circles.get(id),
  });

  const circle = res?.data as CirclePageData | undefined;

  const updateMutation = useMutation({
    mutationFn: (payload: { allowMidCycleJoin?: boolean }) =>
      api.circles.updateSettings(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circle", id] });
      toast.success("Settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMidCycle = () => {
    if (!circle) return;
    setPinDialogOpen(true);
  };

  const doSaveMidCycle = () => {
    if (!circle) return;
    updateMutation.mutate({ allowMidCycleJoin: !circle.allowMidCycleJoin });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-1/3 rounded" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Circle not found.</p>
        <Link href="/circles">
          <button type="button" className="rounded-lg card-interactive px-4 py-2 text-sm">
            Back to Circles
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Circles", href: "/circles" },
          { label: circle.name, href: `/circles/${id}` },
          { label: "Settings" },
        ]}
      />

      <div className="flex items-center gap-3">
        <Link
          href={`/circles/${id}`}
          className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft01Icon className="size-5" />
        </Link>
        <h1 className="text-xl font-bold">Circle Settings</h1>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider">
          Membership
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Allow joining mid-cycle</p>
            <p className="text-xs text-muted-foreground">
              When on, new members can join after the circle has started.
              Late joiners are placed last in rotation and receive a prorated
              payout for their first turn.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleMidCycle}
            disabled={updateMutation.isPending}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
              circle.allowMidCycleJoin ? "bg-primary" : "bg-muted"
            }`}
            role="switch"
            aria-checked={circle.allowMidCycleJoin}
          >
            <span
              className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
                circle.allowMidCycleJoin ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </Card>

      <ActionPinDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        onSuccess={doSaveMidCycle}
      />
    </div>
  );
}
