export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">Security & Compliance</h1>

      <section className="mt-10 space-y-6">
        <div>
          <h2 className="font-semibold">Architecture</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Frontend on Vercel (HTTPS), API with JWT auth (30-min token
            expiry), Nomba for all money movement, encrypted database.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Authentication</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Phone + password + email OTP. 4-6 digit PIN for in-app session
            lock. Passwords hashed with bcrypt (cost 12). Rate limited: 5
            fails = 15min lock.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Encryption</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All traffic TLS 1.3. Database encrypted at rest. BVN encrypted
            with AES-256-GCM.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Webhook Security</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            HMAC-SHA256 verification with timing-safe comparison. Duplicate
            detection via unique request IDs.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Payment Security</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Esusu never holds customer funds. Virtual accounts are
            inbound-only. All payouts via Nomba Transfer API with idempotency
            keys.
          </p>
        </div>
      </section>
    </div>
  );
}
