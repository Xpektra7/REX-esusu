export default function CycleDetailPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Cycle #1</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cycle details and contribution status.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Contributions</h2>
        <div className="mt-2 rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3">Member</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-3" colSpan={3}>
                  <p className="text-muted-foreground">No contributions yet.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
