export default function ReferralsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Referrals</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Invite friends and earn trust score boosts.
      </p>

      <div className="mt-6 rounded-xl border border-border p-6">
        <p className="text-sm text-muted-foreground">Your referral link</p>
        <p className="mt-1 font-mono text-sm">esusu.app/invite/your-code</p>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Referred Users</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No referrals yet. Share your code to start earning.
        </p>
      </section>
    </div>
  );
}
