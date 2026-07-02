"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/utils";
import { CYCLE_STATUS, DEBT_STATUS } from "@/lib/status";
import type { ReportData } from "@/types";
import { AlertCircleIcon } from "hugeicons-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function CycleBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider",
        CYCLE_STATUS[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status === "paid_out"
        ? "Paid Out"
        : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function DebtBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider",
        DEBT_STATUS[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function ReportPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);

  const { data: res, isLoading } = useQuery({
    queryKey: ["circle", id, "report"],
    queryFn: () => api.circles.report(id),
  });

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
          <Button variant="outline" size="sm">
            Back to Circle
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/circles/${id}`}
          className="text-xs tracking-wider text-muted-foreground hover:text-foreground"
        >
          &larr; Circle
        </Link>
        <h1 className="mt-1 text-xl font-bold">Circle Report</h1>
        <p className="text-sm text-muted-foreground">
          Reconciliation audit trail
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-xs text-muted-foreground">
            Total Contributions
          </span>
          <span className="font-heading text-lg font-bold">
            {formatNaira(report.total_contributions_kobo)}
          </span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-xs text-muted-foreground">Total Payouts</span>
          <span className="font-heading text-lg font-bold">
            {formatNaira(report.total_payouts_kobo)}
          </span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-xs text-muted-foreground">Default Rate</span>
          <span className="font-heading text-lg font-bold">
            {report.default_rate}%
          </span>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <span className="text-xs text-muted-foreground">Members</span>
          <span className="font-heading text-lg font-bold">
            {report.members}
          </span>
        </Card>
      </div>

      <Separator />

      <section>
        <h2 className="mb-3 font-bold">Cycle History</h2>
        {report.cycles.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No cycles completed yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {report.cycles.map((cycle) => (
              <div
                key={cycle.cycle_number}
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    Cycle #{cycle.cycle_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatNaira(cycle.total_kobo)}
                    {cycle.completed_at && (
                      <>
                        {" · "}
                        {new Date(cycle.completed_at).toLocaleDateString(
                          "en-NG",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </>
                    )}
                  </p>
                </div>
                <CycleBadge status={cycle.status} />
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator />

      <section>
        <h2 className="mb-3 font-bold">Debt History (FIFO)</h2>
        {report.debts.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No debts recorded.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {report.debts.map((debt, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{debt.member_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNaira(debt.amount_kobo)} · Cycle #{debt.cycle}
                  </p>
                </div>
                <DebtBadge status={debt.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
