export default async function JoinCirclePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return (
    <div>
      <h1 className="text-2xl font-bold">Join Circle</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Join circle {id} with invite code.
      </p>
      <form className="mt-8 max-w-sm space-y-4">
        <div>
          <label htmlFor="code" className="mb-1 block text-sm font-medium">
            Invite Code
          </label>
          <input
            id="code"
            type="text"
            placeholder="Enter invite code"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
        >
          Join Circle
        </button>
      </form>
    </div>
  );
}
