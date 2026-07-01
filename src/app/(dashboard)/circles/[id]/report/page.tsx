export default function ReportPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Circle Report</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Reconciliation audit trail.
      </p>

      <section className="mt-8 space-y-4">
        <div className="rounded-xl border border-border p-5">
          <h2 className="font-semibold">Summary</h2>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p>Total Contributions: ₦0.00</p>
            <p>Total Payouts: ₦0.00</p>
            <p>Outstanding Debts: 0</p>
            <p>Resolved Debts: 0</p>
          </div>
        </div>

        <div className="rounded-xl border border-border p-5">
          <h2 className="font-semibold">Cycles</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No cycles completed yet.
          </p>
        </div>

        <div className="rounded-xl border border-border p-5">
          <h2 className="font-semibold">Debt History (FIFO)</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No debts recorded.
          </p>
        </div>
      </section>
    </div>
  );
}
