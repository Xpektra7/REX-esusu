export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Last updated: July 1, 2026
      </p>

      <section className="mt-10 space-y-6">
        <div>
          <h2 className="font-semibold">1. Information We Collect</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Registration: name, phone, email, BVN. Transaction: balances,
            contributions, payouts, trust scores. Technical: device info, push
            tokens.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">2. BVN Handling</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            BVN is encrypted at rest using AES-256-GCM. Only decrypted when
            provisioning Nomba virtual accounts. Never stored in logs. Only
            last 4 digits ever displayed.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">3. Data Sharing</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We share BVN with Nomba for VA creation. Circle members see your
            name, contribution status, and trust score. We use Vercel and
            Gmail for infrastructure. We do not sell your data.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">4. Data Security</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            BVN encrypted at rest (AES-256-GCM). Passwords hashed with bcrypt
            (cost 12). JWT with 30-min access tokens. Webhooks verified via
            HMAC-SHA256. All traffic encrypted via TLS 1.3.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">5. Contact</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Privacy inquiries: privacy@esusu.app
          </p>
        </div>
      </section>
    </div>
  );
}
