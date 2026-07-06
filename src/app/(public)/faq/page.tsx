const faqs = [
  {
    q: "What is Esusu/Ajo?",
    a: "Esusu is a digital version of the traditional Nigerian Ajo or Esusu savings system. A group of people agree to contribute a fixed amount on a fixed schedule, and each cycle, one member receives the pooled amount.",
  },
  {
    q: "How is my money safe?",
    a: "Your money is held in Nomba — a CBN-licensed fintech. Every user gets their own virtual bank account, and all payouts are processed through Nomba's Transfer API.",
  },
  {
    q: "How does reconciliation work?",
    a: "When you transfer money to your virtual account, Nomba sends us a real-time webhook. Our reconciliation engine automatically matches the payment to your circle and cycle.",
  },
  {
    q: "What happens if I miss a contribution?",
    a: "You get a 24-hour (weekly) or 72-hour (monthly) grace period. If it expires, the amount becomes a tracked debt, you're fined ₦500 (paid to the shorted member), and your trust score drops.",
  },
  {
    q: "What is a trust score?",
    a: "Your trust score (0-100) reflects your reliability based on payment timeliness, cycle completion rate, platform tenure, and referrals. Higher scores earn earlier payout slots.",
  },
  {
    q: "Can I withdraw my money anytime?",
    a: "You can withdraw your wallet balance to any Nigerian bank account at any time. Money committed to an active cycle can't be withdrawn until the cycle completes.",
  },
  {
    q: "How do I join a circle?",
    a: "You need an invite code from an existing member. Circles are invite-only — no public discovery.",
  },
  {
    q: "What fees does Esusu charge?",
    a: "Creating accounts, joining circles, and contributing are free. The only fee is a ₦500 penalty for missed contributions, paid to the shorted member.",
  },
  {
    q: "Is my BVN safe?",
    a: "Yes. Your BVN is encrypted using AES-256-GCM at rest. It's only decrypted when needed to create your virtual account with Nomba. We never display it in full.",
  },
  {
    q: "Can I be in multiple circles?",
    a: "Yes! You can join as many circles as you want, as long as you have sufficient funds for contributions.",
  },
];

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
      <p className="mt-2 text-muted-foreground">
        Everything you need to know about Esusu.
      </p>
      <div className="mt-10 space-y-3">
        {faqs.map((faq) => (
          <details key={faq.q} className="rounded-xl bg-card  p-4 hover:border hover:border-accent">
            <summary className="cursor-pointer font-medium">{faq.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
