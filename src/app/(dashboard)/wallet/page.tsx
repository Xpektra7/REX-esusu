import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function WalletPage() {
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
        <p className="mt-1 text-3xl font-bold">₦0.00</p>
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
