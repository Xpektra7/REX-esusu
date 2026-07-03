"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircleIcon } from "hugeicons-react";
import Link from "next/link";
import { use } from "react";
import { CycleHistoryList } from "@/components/circles/cycle-history-list";
import { DebtHistoryList } from "@/components/circles/debt-history-list";
import { ReportSummaryCards } from "@/components/circles/report-summary-cards";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { CirclePageData, ReportData } from "@/types";

export default function ReportPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);

  const { data: circleRes } = useQuery({
    queryKey: ["circle", id],
    queryFn: () => api.circles.get(id),
  });

  const { data: res, isLoading } = useQuery({
    queryKey: ["circle", id, "report"],
    queryFn: () => api.circles.report(id),
  });

  const circle = circleRes?.data as CirclePageData | undefined;
  const report = res?.data as ReportData | undefined;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-1/3 rounded" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircleIcon className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Report not available.</p>
        <Link href={`/circles/${id}`}>
          <button
            type="button"
            className="rounded-lg bg-card  px-4 py-2 text-sm"
          >
            Back to Circle
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
          { label: circle?.name ?? "Circle", href: `/circles/${id}` },
          { label: "Report" },
        ]}
      />

      <div>
        <h1 className="text-xl font-bold">Circle Report</h1>
        <p className="text-sm text-muted-foreground">
          Reconciliation audit trail
        </p>
      </div>

      <ReportSummaryCards
        totalContributionsKobo={report.totalContributionsKobo}
        totalPayoutsKobo={report.totalPayoutsKobo}
        defaultRate={report.defaultRate}
        members={report.members}
      />

      <Separator />

      <section>
        <h2 className="mb-3 font-bold">Cycle History</h2>
        <CycleHistoryList cycles={report.cycles} circleId={id} />
      </section>

      <Separator />

      <section>
        <h2 className="mb-3 font-bold">Debt History (FIFO)</h2>
        <DebtHistoryList debts={report.debts} />
      </section>
    </div>
  );
}
