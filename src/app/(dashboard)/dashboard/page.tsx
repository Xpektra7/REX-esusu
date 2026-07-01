import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/circles/new"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          New Circle
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { label: "Wallet Balance", value: "₦0.00" },
          { label: "Active Circles", value: "0" },
          { label: "Trust Score", value: "0" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border p-5"
          >
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No activity yet. Join or create a circle to get started.
        </p>
      </section>
    </div>
  );
}
