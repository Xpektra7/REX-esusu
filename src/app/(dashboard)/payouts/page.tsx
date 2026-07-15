"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ReceiptDollarIcon } from "hugeicons-react";
import { useState } from "react";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { ReceiptDialog } from "@/components/shared/receipt-dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatNaira } from "@/lib/utils";
import type { TransferReceipt } from "@/types";

interface PayoutItem {
  id: string;
  amountKobo: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  nombaTransferRef: string | null;
  cycleNumber: number;
  circleName: string;
}

export default function PayoutsPage() {
  const [receiptPayoutId, setReceiptPayoutId] = useState<string | null>(null);

  const receiptMutation = useMutation({
    mutationFn: (id: string) => api.payouts.receipt(id),
  });

  const { data: res, isLoading } = useQuery({
    queryKey: ["payouts"],
    queryFn: () => api.payouts.history(),
  });

  const payouts = (res?.data as { payouts?: PayoutItem[] })?.payouts ?? [];

  const activeReceipt = receiptMutation.data?.data as
    | TransferReceipt
    | undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumbs
        items={[{ label: "Home", href: "/dashboard" }, { label: "Payouts" }]}
      />

      <h1 className="text-xl font-bold">Payout History</h1>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : payouts.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="default">
              <img
                src="/illustrations/empty-wallet.svg"
                alt=""
                loading="lazy"
                decoding="async"
                className="size-32 object-contain"
              />
            </EmptyMedia>
            <EmptyDescription>No payouts received yet.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {payouts.map((po) => (
            <div
              key={po.id}
              className="flex items-center justify-between rounded-xl bg-card px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{po.circleName}</p>
                <p className="text-xs text-muted-foreground">
                  Cycle {po.cycleNumber} &middot;{" "}
                  {new Date(po.createdAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReceiptPayoutId(po.id);
                    receiptMutation.mutate(po.id);
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                  title="View receipt"
                >
                  <ReceiptDollarIcon className="size-4" />
                </button>
                <span className="font-heading text-sm font-bold text-primary">
                  {formatNaira(po.amountKobo)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReceiptDialog
        open={!!receiptPayoutId}
        onOpenChange={(o) => {
          if (!o) setReceiptPayoutId(null);
        }}
        receipt={activeReceipt ?? null}
        loading={receiptMutation.isPending}
      />
    </div>
  );
}
