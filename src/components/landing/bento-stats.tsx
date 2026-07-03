import {
  CheckmarkCircle01Icon,
  SavingsIcon,
  Shield01Icon,
  UserGroupIcon,
} from "hugeicons-react";

export function BentoStats() {
  return (
    <section className="border-b border-border py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="mb-1 flex items-center gap-2">
              <Shield01Icon className="size-4 text-naira-green" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Insured & Secure
              </span>
            </div>
            <p className="text-2xl font-bold md:text-3xl">₦0.00</p>
            <p className="text-sm text-muted-foreground">
              Total Community Payouts This Month
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
              <UserGroupIcon className="size-4 text-primary" />
            </div>
            <p className="text-xl font-bold">0</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Active Circles
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
              <CheckmarkCircle01Icon className="size-4 text-naira-green" />
            </div>
            <p className="text-xl font-bold">100%</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Success Rate
            </p>
          </div>

          <div className="col-span-2 rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-lg font-semibold">How it works</h3>
              <SavingsIcon className="size-4 text-muted-foreground" />
            </div>

            <div className="mt-5 space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  1
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Create or Join a Circle
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Set your contribution amount and invite people you trust.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  2
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Automate Contributions
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Payments are collected automatically from your wallet each
                    cycle.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  3
                </div>
                <div>
                  <p className="text-sm font-semibold">Receive Your Payout</p>
                  <p className="text-sm text-muted-foreground">
                    Get the full rotation pot when it&apos;s your turn.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
