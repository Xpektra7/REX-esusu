export default function CreateCirclePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Create Circle</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Set up a new savings circle.
      </p>
      <form className="mt-8 max-w-md space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Circle Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="e.g. Family Savings"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="amount" className="mb-1 block text-sm font-medium">
            Contribution Amount (₦)
          </label>
          <input
            id="amount"
            type="number"
            placeholder="5000"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="frequency"
            className="mb-1 block text-sm font-medium"
          >
            Frequency
          </label>
          <select
            id="frequency"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label htmlFor="members" className="mb-1 block text-sm font-medium">
            Number of Members
          </label>
          <input
            id="members"
            type="number"
            placeholder="5"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
        >
          Create Circle
        </button>
      </form>
    </div>
  );
}
