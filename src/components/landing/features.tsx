import {
  BarChartIcon,
  CheckmarkCircle01Icon,
  Shield01Icon,
  UserGroupIcon,
} from "hugeicons-react";

const features = [
  {
    icon: CheckmarkCircle01Icon,
    title: "Automatic Reconciliation",
    description:
      "Real-time matching via Nomba webhooks. Handles exact, under, over, and misdirected payments.",
  },
  {
    icon: BarChartIcon,
    title: "Trust Score System",
    description:
      "Multi-factor scoring determines rotation priority. Higher score = earlier payout slot.",
  },
  {
    icon: UserGroupIcon,
    title: "Debt Rollover Protection",
    description:
      "Missed contributions become tracked debts. FIFO clearing protects honest members.",
  },
  {
    icon: Shield01Icon,
    title: "Full Transparency",
    description:
      "Every member sees who paid, who owes, and where the money is — no more opacity.",
  },
];

export function Features() {
  return (
    <section className="border-b border-border py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="mb-12 text-center text-2xl font-bold md:text-3xl">
          Why Esusu?
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="rounded-xl border border-border p-6">
                <div className="flex size-10 items-center justify-center rounded-full border border-border bg-card">
                  <Icon className="size-4 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
