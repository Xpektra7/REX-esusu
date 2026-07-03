"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { DiceBearAvatar } from "@/components/shared/dicebear-avatar";
import { formatNaira } from "@/lib/utils";
import {
  ViewIcon,
  ViewOffIcon,
  PlusSignIcon,
  ArrowUp01Icon,
} from "hugeicons-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RawTx {
  type: string;
  amountKobo: number;
  reference: string;
  status: string;
  createdAt: string;
}

interface Transaction {
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
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

  const balanceKobo = res?.data?.balanceKobo ?? 0;
  const rawTxs = (txRes?.data as { transactions?: RawTx[] })?.transactions ?? [];
  const transactions: Transaction[] = rawTxs.map((t) => ({
    type: t.type as "credit" | "debit",
    amount: t.amountKobo,
    description: t.reference,
    date: t.createdAt,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Wallet" },
        ]}
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
              {hidden ? "****" : formatNaira(balanceKobo, 2)}
            </p>

            <div className="flex gap-3">
              <Link
                href="/wallet"
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
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No transactions yet.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx, i) => {
              const isCredit = tx.type === "credit";
              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <DiceBearAvatar name={tx.description} />
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString("en-NG", {
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
                    {formatNaira(tx.amount)}
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
