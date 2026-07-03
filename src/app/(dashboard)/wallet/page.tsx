"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowUp01Icon,
  PlusSignIcon,
  ViewIcon,
  ViewOffIcon,
} from "hugeicons-react";
import Link from "next/link";
import { useState } from "react";
import { DiceBearAvatar } from "@/components/shared/dicebear-avatar";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn, formatNaira } from "@/lib/utils";

interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  amountKobo: number;
  reference: string;
  status: string;
  description: string;
  metadata: unknown;
  createdAt: string;
}

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

  const { data: res, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.wallet.get(),
  });

  const { data: txRes } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: () => api.wallet.transactions(),
  });

  const wallet = res?.data as WalletData | undefined;
  const transactions = ((txRes?.data as { transactions: WalletTransaction[] } | undefined)?.transactions ?? []) as WalletTransaction[];

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
                  "bg-card-foreground text-card text-xs font-bold tracking-wider hover:opacity-90 transition-opacity",
                )}
              >
                <PlusSignIcon className="size-4" />
                Top Up
              </Link>
              <Link
                href="/wallet/withdraw"
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3",
                  "bg-background text-card-foreground text-xs font-bold tracking-wider hover:opacity-90 transition-opacity",
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

        {transactions.length === 0 ? (
          <Card className="flex flex-col items-center gap-4 p-8 text-center">
            <img
              src="/illustrations/empty.svg"
              alt=""
              className="size-32 object-contain opacity-40"
            />
            <p className="text-sm text-muted-foreground">
              No transactions yet.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => {
              const isCredit = tx.type === "credit";
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <DiceBearAvatar name={tx.description} />
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
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
              );
            })}
          </div>
        )}
      </section>

      <Separator />

      <Link href="/wallet/withdraw">
        <Button className="w-full">
          <ArrowUp01Icon className="size-4" />
          Withdraw Funds
        </Button>
      </Link>
    </div>
  );
}
