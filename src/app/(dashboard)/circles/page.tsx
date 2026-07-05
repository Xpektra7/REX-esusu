"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusSignIcon } from "hugeicons-react";
import Link from "next/link";
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
  const { data, isLoading } = useQuery({
    queryKey: ["circles"],
    queryFn: () => api.circles.list(),
  });

  const circles = (data?.data?.circles ?? []) as CircleData[];

  return (
    <div className="flex flex-col gap-6">
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
              No circles yet. Create one to start saving with your group.
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

      {/* FAB */}
      {circles.length > 0 && (
        <Link
          href="/circles/new"
          className="fixed bottom-24 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-card-foreground shadow-lg"
          aria-label="Create circle"
        >
          <PlusSignIcon className="size-6" />
        </Link>
      )}
    </div>
  );
}
