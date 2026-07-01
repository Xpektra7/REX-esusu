import {
  UserGroupIcon,
  BankIcon,
  CheckmarkCircle01Icon,
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
  return (
    <section className="border-b border-border py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="mb-12 text-center text-2xl font-bold md:text-3xl">
          How It Works
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex flex-col items-center text-center">
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
    </section>
  );
}
