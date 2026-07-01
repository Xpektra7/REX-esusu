import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CircleDetailPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/circles"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Circles
          </Link>
          <h1 className="text-2xl font-bold">Circle Name</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="./report"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Report
          </Link>
          <Link
            href="./join"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Invite
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { label: "Contribution", value: "₦5,000" },
          { label: "Members", value: "5" },
          { label: "Current Cycle", value: "#1" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border p-4"
          >
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Members</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No members yet.
        </p>
      </section>
    </div>
  );
}
