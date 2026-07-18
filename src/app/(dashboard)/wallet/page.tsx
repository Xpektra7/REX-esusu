"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowUp01Icon,
  PlusSignIcon,
  ReceiptDollarIcon,
  ViewIcon,
  ViewOffIcon,
} from "hugeicons-react";
import Link from "next/link";
import { useState } from "react";
import { DiceBearAvatar } from "@/components/shared/dicebear-avatar";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { ReceiptDialog } from "@/components/shared/receipt-dialog";
import { TransactionDetailDialog } from "@/components/shared/transaction-detail-dialog";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn, formatNaira, formatDate } from "@/lib/utils";
import type { TransferReceipt, WalletTransaction } from "@/types";

interface WalletData {
  balanceKobo: number;
  virtualAccount: {
    accountNumber: string;
    accountName: string;
    bankCode: string;
  };
  pendingReconciliationKobo: number;
}

export default function WalletPage() {
  const [hidden, setHidden] = useState(false);
  const [receiptTxId, setReceiptTxId] = useState<string | null>(null);
  const [detailTx, setDetailTx] = useState<WalletTransaction | null>(null);

  const receiptMutation = useMutation({
    mutationFn: (id: string) => api.wallet.receipt(id),
  });

  const { data: res, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.wallet.get(),
    refetchInterval: 5_000,
  });

  const { data: txRes, isLoading: txLoading } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: () => api.wallet.transactions(),
    refetchInterval: 5_000,
  });

  const wallet = res?.data as WalletData | undefined;
  const transactions = ((
    txRes?.data as { transactions: WalletTransaction[] } | undefined
  )?.transactions ?? []) as WalletTransaction[];

  const activeReceipt = receiptMutation.data?.data as
    | TransferReceipt
    | undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumbs
        items={[{ label: "Home", href: "/dashboard" }, { label: "Wallet" }]}
      />

      {isLoading ? (
        <Skeleton className="h-44 rounded-xl" />
      ) : (
        <section className="relative overflow-hidden rounded-xl bg-primary p-5">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-xs tracking-widest text-card-foreground/80">
                Available Balance
              </p>
              <button
                type="button"
                onClick={() => setHidden(!hidden)}
                aria-label={hidden ? "Show balance" : "Hide balance"}
              >
                {hidden ? (
                  <ViewOffIcon className="size-4 text-card-foreground/60" />
                ) : (
                  <ViewIcon className="size-4 text-card-foreground/60" />
                )}
              </button>
            </div>

            <p className="py-3 font-heading text-3xl font-semibold text-card-foreground">
              {hidden ? "****" : formatNaira(wallet?.balanceKobo ?? 0, 2)}
            </p>

            <div className="flex gap-3">
              <Link
                href="/wallet/topup"
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3",
                  "bg-card-foreground text-card text-xs font-bold tracking-wider hover: transition-opacity",
                )}
              >
                <PlusSignIcon className="size-4" />
                Top Up
              </Link>
              <Link
                href="/wallet/withdraw"
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3",
                  "bg-background text-card-foreground text-xs font-bold tracking-wider hover: transition-opacity",
                )}
              >
                <ArrowUp01Icon className="size-4" />
                Send
              </Link>
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider">
          Transaction History
        </h2>

        {txLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Skeleton key={n} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
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
              <EmptyDescription>No transactions yet.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => {
              const isCredit = tx.type === "credit";
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl bg-card  px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <DiceBearAvatar name={tx.description ?? ""} />
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.createdAt, {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCredit ? (
                      <button
                        type="button"
                        onClick={() => setDetailTx(tx)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                        title="View details"
                      >
                        <ViewIcon className="size-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptTxId(tx.id);
                          receiptMutation.mutate(tx.id);
                        }}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                        title="View receipt"
                      >
                        <ReceiptDollarIcon className="size-4" />
                      </button>
                    )}
                    <p
                      className={cn(
                        "font-heading text-sm font-bold",
                        isCredit ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {isCredit ? "+" : "-"}
                      {formatNaira(tx.amountKobo)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Link href="/wallet/withdraw">
        <Button className="w-full">
          <ArrowUp01Icon className="size-4" />
          Withdraw Funds
        </Button>
      </Link>

      <ReceiptDialog
        open={!!receiptTxId}
        onOpenChange={(o) => {
          if (!o) setReceiptTxId(null);
        }}
        receipt={activeReceipt ?? null}
        loading={receiptMutation.isPending}
      />

      <TransactionDetailDialog
        open={!!detailTx}
        onOpenChange={(o) => {
          if (!o) setDetailTx(null);
        }}
        tx={
          detailTx
            ? {
                id: detailTx.id,
                amountKobo: detailTx.amountKobo,
                reference: detailTx.reference,
                status: detailTx.status,
                description: detailTx.description,
                metadata: detailTx.metadata as Record<string, unknown> | null,
                createdAt: detailTx.createdAt,
              }
            : null
        }
      />
    </div>
  );
}
