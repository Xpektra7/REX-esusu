"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Coins02Icon,
  MoneyAdd01Icon,
  Notification01Icon,
  UserAdd01Icon,
  UserGroupIcon,
  Wallet01Icon,
} from "hugeicons-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatNaira, timeAgo } from "@/lib/utils";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty as EmptyState,
  EmptyDescription,
  EmptyHeader,
} from "@/components/ui/empty";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
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

const notifIcons: Record<string, { icon: React.ReactNode; bg: string }> = {
  payout: {
    icon: <MoneyAdd01Icon className="size-3" />,
    bg: "bg-foreground text-primary",
  },
  contribution_due: {
    icon: <Coins02Icon className="size-3" />,
    bg: "bg-primary text-foreground",
  },
  member_join: {
    icon: <UserAdd01Icon className="size-3" />,
    bg: "bg-foreground text-primary",
  },
  circle_completed: {
    icon: <UserGroupIcon className="size-3" />,
    bg: "bg-primary text-foreground",
  },
};

export function RightPanel() {
  const { data: notifRes, isLoading: notifsLoading } = useQuery({
    queryKey: ["notifications-mini"],
    queryFn: () => api.notifications.list(),
  });

  const { data: txRes, isLoading: txsLoading } = useQuery({
    queryKey: ["wallet-transactions-mini"],
    queryFn: () => api.wallet.transactions(),
  });

  const notifications = ((Array.isArray(notifRes?.data) ? notifRes.data : []) as NotificationItem[]).slice(0, 5);
  const transactions = ((Array.isArray(txRes?.data) ? txRes.data : []) as TransactionItem[]).slice(0, 5);

  return (
    <aside className="flex h-full flex-col gap-4 overflow-y-auto p-4 pl-0">
      {/*Recent Notifications*/}
      <section className="flex min-h-0 h-fit flex-1 flex-col rounded-xl pb-4 bg-card">
        <div className="flex items-center justify-between p-4 pb-0">
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

        <div className="flex-1">
          {notifsLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="flex flex-col gap-1 rounded-lg px-3 py-2"
                >
                  <Skeleton className="h-3 w-3/4 rounded" />
                  <Skeleton className="h-2.5 w-full rounded" />
                  <Skeleton className="h-2 w-1/4 rounded" />
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <ItemGroup className="bg-transparent">
              {notifications.map((n) => {
                const meta = notifIcons[n.type] ?? {
                  icon: <Notification01Icon className="size-3" />,
                  bg: "bg-primary text-foreground",
                };
                return (
                  <Item key={n.id} variant="muted" size="xs">
                    <ItemMedia
                      variant="icon"
                      className={`rounded-full size-6 ${meta.bg}`}
                    >
                      {meta.icon}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{n.title}</ItemTitle>
                      <ItemDescription>{n.body}</ItemDescription>
                    </ItemContent>
                  </Item>
                );
              })}
            </ItemGroup>
          ) : (
            <EmptyState className="p-4 border-none">
              <EmptyHeader>
                <EmptyDescription>No notifications yet</EmptyDescription>
              </EmptyHeader>
            </EmptyState>
          )}
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col gap-3 rounded-xl bg-card p-4">
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

        <div className="flex-1">
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
            <ItemGroup className="bg-transparent">
              {transactions.map((tx) => (
                <Item key={tx.id} variant="muted" size="xs">
                  <ItemContent>
                    <ItemTitle>{tx.description}</ItemTitle>
                    <ItemDescription>{timeAgo(tx.createdAt)}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <span
                      className={`text-xs font-bold ${
                        tx.type === "credit"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {tx.type === "credit" ? "+" : "-"}
                      {formatNaira(tx.amountKobo)}
                    </span>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          ) : (
            <EmptyState className="p-4 border-none">
              <EmptyHeader>
                <EmptyDescription>No transactions yet</EmptyDescription>
              </EmptyHeader>
            </EmptyState>
          )}
        </div>
      </section>
    </aside>
  );
}
