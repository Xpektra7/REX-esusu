"use client";

import { useQuery } from "@tanstack/react-query";
import { Key01Icon, PlusSignIcon } from "hugeicons-react";
import Link from "next/link";
import { useState } from "react";
import { JoinByCodeDialog } from "@/components/circles/join-by-code-dialog";
import { CircleCard, type CircleData } from "@/components/shared/circle-card";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

export default function CirclesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["circles"],
    queryFn: () => api.circles.list(),
  });

  const circles = (data?.data?.circles ?? []) as CircleData[];

  return (
    <div className="relative min-h-screen flex flex-col gap-6">
      <PageBreadcrumbs
        items={[{ label: "Home", href: "/dashboard" }, { label: "Circles" }]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Circles</h1>
        <span className="text-xs text-muted-foreground">
          {circles.length} active
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : circles.length > 0 ? (
        <div className="flex flex-col gap-4">
          {circles.map((circle) => (
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
              No circles yet. Create one or join with a code to start saving
              with your group.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDialogOpen(true)}
              >
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

      {/* FAB */}
      {circles.length > 0 && (
        <div className="absolute bottom-24 right-5 z-50 flex flex-col items-end gap-3">
          <Button
            size="icon"
            variant="outline"
            className="size-14 rounded-full shadow-lg"
            aria-label="Join with code"
            onClick={() => setDialogOpen(true)}
          >
            <Key01Icon className="size-6" />
          </Button>
          <Link
            href="/circles/new"
            className="flex size-14 items-center justify-center rounded-full bg-primary text-card-foreground shadow-lg"
            aria-label="Create circle"
          >
            <PlusSignIcon className="size-6" />
          </Link>
        </div>
      )}

      <JoinByCodeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
