// how-it-works.tsx
import {
  BankIcon,
  CheckmarkCircle01Icon,
  UserGroupIcon,
} from "hugeicons-react";

const steps = [
  {
    number: "01",
    icon: UserGroupIcon,
    title: "Create or join a circle",
    description:
      "Set your contribution amount and frequency. Invite members with a private code.",
  },
  {
    number: "02",
    icon: BankIcon,
    title: "Get your virtual account",
    description:
      "Each member gets a personal Nigerian bank account number from Nomba — no shared accounts.",
  },
  {
    number: "03",
    icon: CheckmarkCircle01Icon,
    title: "Contribute and get paid",
    description:
      "Transfer your contribution. Our engine reconciles payments, tracks debts, and sends payouts.",
  },
];

export function HowItWorks() {
  // half-column-width inset so the line starts/ends at the center
  // of the first and last icon circles, not the container edges
  const lineInsetPercent = 100 / (steps.length * 2);

  return (
    <section className="landing-section">
      <div className="landing-container max-w-4xl">
        <div className="mb-12 text-center md:mb-16">
          <p className="eyebrow text-muted-foreground">How it works</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">
            Three steps to your first payout
          </h2>
        </div>

        <div className="relative">
          {/* connecting line, spans icon-center to icon-center, row layout only */}
          <div
            aria-hidden="true"
            className="absolute top-6 hidden h-px bg-border md:block"
            style={{
              left: `${lineInsetPercent}%`,
              right: `${lineInsetPercent}%`,
            }}
          />

          <div className="relative grid gap-10 md:grid-cols-3 md:gap-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="flex flex-col items-center text-center"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary">
                    <Icon className="size-5 text-primary-foreground" />
                  </div>
                  <span className="eyebrow mt-4 text-muted-foreground">
                    {step.number}
                  </span>
                  <h3 className="mt-1 font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
