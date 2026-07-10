import {
  BarChartIcon,
  CheckmarkCircle01Icon,
  Shield01Icon,
  UserGroupIcon,
} from "hugeicons-react";

const features = [
  {
    number: "01",
    icon: CheckmarkCircle01Icon,
    title: "Automatic Reconciliation",
    description:
      "Real-time matching via Nomba webhooks. Handles exact, under, over, and misdirected payments.",
  },
  {
    number: "02",
    icon: BarChartIcon,
    title: "Trust Score System",
    description:
      "Multi-factor scoring determines rotation priority. Higher score = earlier payout slot.",
  },
  {
    number: "03",
    icon: UserGroupIcon,
    title: "Debt Rollover Protection",
    description:
      "Missed contributions become tracked debts. FIFO clearing protects honest members.",
  },
  {
    number: "04",
    icon: Shield01Icon,
    title: "Full Transparency",
    description:
      "Every member sees who paid, who owes, and where the money is — no more opacity.",
  },
];

export function Features() {
  return (
    <section className="landing-section bg-foreground">
      <div className="landing-container">
        <div className="mb-12 md:mb-16">
          <p className="eyebrow text-muted-foreground">Why Esusu</p>
          <h2 className="mt-2 text-2xl text-card font-bold md:text-3xl">
            Built to remove every trust issue
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex flex-col gap-4 rounded-xl p-6 md:p-8 border border-muted/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
                    <Icon className="size-6 text-foreground" />
                  </div>
                  <span className="eyebrow text-background">
                    {feature.number}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-card">{feature.title}</h3>
                  <p className="mt-1 text-sm text-background/80">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
