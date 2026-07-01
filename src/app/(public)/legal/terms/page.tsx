export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">Terms & Conditions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Last updated: July 1, 2026
      </p>

      <section className="mt-10 space-y-6">
        <div>
          <h2 className="font-semibold">1. Acceptance of Terms</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            By creating an account or using Esusu, you agree to these Terms.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">2. Description of Service</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Esusu is a digital group savings platform using Nomba's Virtual
            Account infrastructure for personal VAs, circle management,
            automated reconciliation, and payouts.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">3. Eligibility</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Must be 18 years or older</li>
            <li>Must have a valid Nigerian phone number</li>
            <li>Must provide accurate KYC information</li>
            <li>Must have a Nigerian bank account for payouts</li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold">4. User Responsibilities</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Provide accurate registration information</li>
            <li>Keep credentials and PIN confidential</li>
            <li>Make contributions on time</li>
            <li>Not manipulate trust scores or rotation order</li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold">5. Fees</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Creating accounts and circles is free. Missed contributions incur a
            ₦500 fine paid to the shorted member.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">6. Limitation of Liability</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Esusu is a technology platform, not a bank. We are not liable for
            defaults by other members, delays in bank transfers, or losses from
            compromised credentials.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">7. Contact</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            For questions: support@esusu.app
          </p>
        </div>
      </section>
    </div>
  );
}
