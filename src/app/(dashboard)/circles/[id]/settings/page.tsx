"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft01Icon } from "hugeicons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { ActionPinDialog } from "@/components/shared/action-pin-dialog";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { CirclePageData } from "@/types";

export default function CircleSettingsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [capacityPinOpen, setCapacityPinOpen] = useState(false);
  const [namePinOpen, setNamePinOpen] = useState(false);
  const [name, setName] = useState("");

  const { data: res, isLoading } = useQuery({
    queryKey: ["circle", id],
    queryFn: () => api.circles.get(id),
  });

  const circle = res?.data as CirclePageData | undefined;
  const isAdmin = circle?.role === "admin";

  // Keep the editable name in sync with the loaded circle.
  useEffect(() => {
    if (circle) setName(circle.name);
  }, [circle]);

  const updateMutation = useMutation({
    mutationFn: (payload: {
      name?: string;
      allowMidCycleJoin?: boolean;
      capacityEnabled?: boolean;
    }) => api.circles.updateSettings(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circle", id] });
      toast.success("Settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const activateMutation = useMutation({
    mutationFn: () => api.circles.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circle", id] });
      toast.success("Circle started!");
      router.push(`/circles/${id}`);
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

  const toggleCapacity = () => {
    if (!circle) return;
    setCapacityPinOpen(true);
  };

  const doSaveCapacity = () => {
    if (!circle) return;
    // Toggling joining OFF caps the circle at its current member count
    // (handled server-side). Toggling ON reopens it without a cap.
    updateMutation.mutate({ capacityEnabled: !circle.capacityEnabled });
  };

  const saveName = () => {
    if (!name.trim() || name.trim() === circle?.name) return;
    setNamePinOpen(true);
  };

  const doSaveName = () => {
    if (!circle) return;
    updateMutation.mutate({ name: name.trim() });
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

  // Settings are admin-only.
  if (!isAdmin) {
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
            className="symbol-container bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft01Icon className="symbol-width" />
          </Link>
          <h1 className="text-xl font-bold">Circle Settings</h1>
        </div>
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Only the circle admin can manage settings.
          </p>
        </Card>
      </div>
    );
  }

  const memberCount = circle.members?.length ?? 0;
  const canActivate = circle.status === "pending" && memberCount >= 2;

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
          className="symbol-container bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft01Icon className="symbol-width" />
        </Link>
        <h1 className="text-xl font-bold">Circle Settings</h1>
      </div>

      {circle.status === "pending" && (
        <Card className="flex flex-col gap-3 p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Start Circle
          </h2>
          <p className="text-xs text-muted-foreground">
            Once at least 2 members have joined, the admin can kick-start the
            circle. This creates the first cycle and assigns the payout order.
          </p>
          <Button
            onClick={() => activateMutation.mutate()}
            disabled={!canActivate || activateMutation.isPending}
            className="w-fit"
          >
            {activateMutation.isPending
              ? "Starting..."
              : canActivate
                ? "Kick-start Circle"
                : `Need ${Math.max(0, 2 - memberCount)} more member(s) to start`}
          </Button>
        </Card>
      )}

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider">
          Circle Name
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="circleName"
              className="mb-1 block text-[10px] font-semibold tracking-[0.05em] text-muted-foreground uppercase"
            >
              Name
            </label>
            <Input
              id="circleName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={name.trim().length === 0}
            />
          </div>
          <Button
            onClick={saveName}
            disabled={
              updateMutation.isPending ||
              name.trim().length === 0 ||
              name.trim() === circle.name
            }
          >
            {updateMutation.isPending ? "Saving..." : "Save Name"}
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider">
          Membership
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Allow joining mid-cycle</p>
            <p className="text-xs text-muted-foreground">
              When on, new members can join after the circle has started. Late
              joiners are placed last in rotation and receive a prorated payout
              for their first turn.
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

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider">
          Capacity
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Allow new members to join</p>
            <p className="text-xs text-muted-foreground">
              When on, anyone with the invite code can join. Turn off to lock
              the circle at its current member count.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleCapacity}
            disabled={updateMutation.isPending}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
              circle.capacityEnabled ? "bg-muted" : "bg-primary"
            }`}
            role="switch"
            aria-checked={!circle.capacityEnabled}
          >
            <span
              className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
                circle.capacityEnabled ? "translate-x-0" : "translate-x-5"
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

      <ActionPinDialog
        open={capacityPinOpen}
        onOpenChange={setCapacityPinOpen}
        onSuccess={doSaveCapacity}
      />

      <ActionPinDialog
        open={namePinOpen}
        onOpenChange={setNamePinOpen}
        onSuccess={doSaveName}
      />
    </div>
  );
}
