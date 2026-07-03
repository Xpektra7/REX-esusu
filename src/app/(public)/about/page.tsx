export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">About Esusu</h1>
      <p className="mt-2 text-muted-foreground">
        Digital group savings, powered by Nomba.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Our Story</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Millions of Nigerians participate in traditional Ajo/Esusu savings
          groups, but these systems are manual, trust-dependent, and lack
          transparency. Esusu digitizes this trusted tradition using Nomba's
          Virtual Account infrastructure — giving every user a real bank account
          number, automatic reconciliation via webhooks, and complete
          transparency into every cycle.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Key Features</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[
            {
              title: "Automatic Reconciliation",
              desc: "Real-time matching via Nomba webhooks. Handles exact, under, over, and misdirected payments.",
            },
            {
              title: "Trust Score System",
              desc: "Multi-factor scoring determines rotation priority. Higher score = earlier payout slot.",
            },
            {
              title: "Debt Rollover Protection",
              desc: "Missed contributions become tracked debts. FIFO clearing protects honest members.",
            },
            {
              title: "Full Transparency",
              desc: "Every member sees who paid, who owes, and where the money is.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl bg-card  p-5">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Built With</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Next.js · Nomba API · PostgreSQL · Vercel · Tailwind CSS · shadcn/ui
        </p>
      </section>
    </div>
  );
}
