"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatNaira } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function WalletPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.wallet.get(),
  });

  const wallet = data?.data as any;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Wallet</h1>
        <Link
          href="/wallet/withdraw"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          Withdraw
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-border p-6">
        <p className="text-sm text-muted-foreground">Available Balance</p>
        {isLoading ? (
          <Skeleton className="mt-1 h-9 w-48" />
        ) : (
          <p className="mt-1 text-3xl font-bold">{formatNaira(wallet?.balanceKobo ?? 0)}</p>
        )}
        {wallet?.virtualAccount && (
          <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
            <p>Account: {wallet.virtualAccount.accountNumber}</p>
            <p>Bank: {wallet.virtualAccount.bankCode}</p>
          </div>
        )}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Transaction History</h2>
        <div className="mt-2 rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3">Date</th>
                <th className="p-3">Description</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3" colSpan={4}>
                  <p className="text-muted-foreground">No transactions yet.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
