import {
  BankIcon,
  CheckmarkCircle01Icon,
  Shield01Icon,
  UserGroupIcon,
} from "hugeicons-react";

const points = [
  { icon: BankIcon, label: "Real Nigerian bank account, per member" },
  { icon: Shield01Icon, label: "CBN-licensed infrastructure via Nomba" },
  {
    icon: CheckmarkCircle01Icon,
    label: "Every transfer reconciled automatically",
  },
  { icon: UserGroupIcon, label: "Every member sees the same ledger" },
];

export function Security() {
  return (
    <section className="bg-foreground py-16 text-background md:py-20">
      <div className="landing-container">
        <div className="max-w-lg">
          <p className="eyebrow text-background/60">Built on Nomba</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">
            Your money moves through regulated infrastructure
          </h2>
          <p className="mt-3 text-sm text-background/70 md:text-base">
            Every user gets their own Nomba virtual account — a real Nigerian
            bank account number provided by a CBN-licensed fintech. No shared
            pots, no cash handoffs.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {points.map((point) => {
            const Icon = point.icon;
            return (
              <div
                key={point.label}
                className="flex flex-col gap-3 rounded-xl border border-background/15 p-5"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
                  <Icon className="size-6 text-foreground" />
                </div>
                <p className="text-sm text-background/80">{point.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
