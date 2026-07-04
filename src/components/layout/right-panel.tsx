"use client";

import { useQuery } from "@tanstack/react-query";
import { Notification01Icon, Wallet01Icon } from "hugeicons-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatNaira, timeAgo } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface TransactionItem {
  id: string;
  type: "credit" | "debit";
  amountKobo: number;
  description: string;
  createdAt: string;
}

export function RightPanel() {
  const { data: notifRes, isLoading: notifsLoading } = useQuery({
    queryKey: ["notifications-mini"],
    queryFn: () => api.notifications.list(),
  });

  const { data: txRes, isLoading: txsLoading } = useQuery({
    queryKey: ["wallet-transactions-mini"],
    queryFn: () => api.wallet.transactions(),
  });

  const notifications = (
    (notifRes?.data as { notifications: NotificationItem[] } | undefined)
      ?.notifications ?? []
  ).slice(0, 5);
  const transactions = (
    (txRes?.data as { transactions: TransactionItem[] } | undefined)
      ?.transactions ?? []
  ).slice(0, 5);

  return (
    <aside className="flex h-full flex-col gap-4 overflow-y-auto p-4 pl-0">
      {/*Recent Notifications*/}
      <div className="flex flex-col gap-3 rounded-xl bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider">
            <Notification01Icon className="size-3" />
            Notifications
          </h3>
          <Link
            href="/notifications"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        {notifsLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col gap-1 rounded-lg px-3 py-2">
                <Skeleton className="h-3 w-3/4 rounded" />
                <Skeleton className="h-2.5 w-full rounded" />
                <Skeleton className="h-2 w-1/4 rounded" />
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="flex flex-col gap-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex flex-col gap-0.5 rounded-lg bg-card px-3 py-2"
              >
                <p className="text-xs font-medium">{n.title}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {n.message}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {timeAgo(n.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No notifications yet
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider">
            <Wallet01Icon className="size-3" />
            Recent Transactions
          </h3>
          <Link
            href="/wallet"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        {txsLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="flex items-center justify-between px-3 py-2"
              >
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-3 w-24 rounded" />
                  <Skeleton className="h-2.5 w-16 rounded" />
                </div>
                <Skeleton className="h-3 w-12 rounded" />
              </div>
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-lg bg-card px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">
                    {tx.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {timeAgo(tx.createdAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-xs font-bold ${
                    tx.type === "credit"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {tx.type === "credit" ? "+" : "-"}
                  {formatNaira(tx.amountKobo)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No transactions yet
          </p>
        )}
      </div>
    </aside>
  );
}
