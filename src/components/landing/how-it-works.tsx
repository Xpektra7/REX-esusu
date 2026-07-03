// how-it-works.tsx
import {
  BankIcon,
  CheckmarkCircle01Icon,
  UserGroupIcon,
} from "hugeicons-react";

const steps = [
  {
    icon: UserGroupIcon,
    title: "Create or join a circle",
    description:
      "Set your contribution amount and frequency. Invite members with a private code.",
  },
  {
    icon: BankIcon,
    title: "Get your virtual account",
    description:
      "Each member gets a personal Nigerian bank account number from Nomba — no shared accounts.",
  },
  {
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
    <section className="border-b border-border py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-12 text-center md:mb-16">
          <h2 className="text-2xl font-bold md:text-3xl">How It Works</h2>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Three steps from sign-up to your first payout.
          </p>
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
                  <div className="flex size-12 items-center justify-center rounded-full border border-border bg-card">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
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