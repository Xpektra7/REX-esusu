export default function WithdrawPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Withdraw</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Transfer your wallet balance to your bank account.
      </p>
      <form className="mt-8 max-w-md space-y-4">
        <div>
          <label htmlFor="amount" className="mb-1 block text-sm font-medium">
            Amount (₦)
          </label>
          <input
            id="amount"
            type="number"
            placeholder="0.00"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="bank" className="mb-1 block text-sm font-medium">
            Bank
          </label>
          <select
            id="bank"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option>Select bank</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="account"
            className="mb-1 block text-sm font-medium"
          >
            Account Number
          </label>
          <input
            id="account"
            type="text"
            placeholder="0123456789"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
        >
          Withdraw
        </button>
      </form>
    </div>
  );
}
