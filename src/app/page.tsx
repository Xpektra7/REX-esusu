import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  UserGroupIcon,
  BankIcon,
  CheckmarkCircle01Icon,
  BarChartIcon,
  Shield01Icon,
  SmartPhone01Icon,
} from "hugeicons-react";
import { InstallPrompt } from "@/components/shared/install-prompt";
import Link from "next/link";

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-bold">
          Esusu
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            About
          </Link>
          <Link
            href="/faq"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            FAQ
          </Link>
          <Link href="/contact" className={cn(buttonVariants({}))}>
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-20 text-center md:py-28">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
          Save together,{" "}
          <span className="text-primary">transparently</span>
        </h1>
        <p className="max-w-xl text-base text-muted-foreground md:text-lg">
          Digital group savings powered by Nomba. Create circles, invite
          members, contribute automatically, and get paid — no paper, no
          trust issues.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/contact" className={cn(buttonVariants({ size: "lg" }))}>
            Start Saving
          </Link>
          <Link href="/about" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            How It Works
          </Link>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
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

function Features() {
  return (
    <section className="border-b border-border py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="mb-12 text-center text-2xl font-bold md:text-3xl">
          Why Esusu?
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="rounded-xl border border-border p-6"
              >
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

function Security() {
  return (
    <section className="border-b border-border py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border bg-card">
          <Shield01Icon className="size-5 text-primary" />
        </div>
        <h2 className="mt-4 text-2xl font-bold md:text-3xl">
          Built on Nomba
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Every user gets their own Nomba virtual account — a real Nigerian
          bank account number provided by a CBN-licensed fintech. All money
          moves through regulated infrastructure.
        </p>
      </div>
    </section>
  );
}

function InstallSection() {
  return (
    <section className="border-b border-border py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <InstallPrompt />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Esusu. Built for the Nomba
            Hackathon.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/legal/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/legal/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/legal/security" className="hover:text-foreground">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <Security />
        <InstallSection />
      </main>
      <Footer />
    </div>
  );
}
