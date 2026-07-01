export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your account settings.
      </p>

      <section className="mt-8 max-w-md space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <p className="text-sm text-muted-foreground">
            Update your display name.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          <p className="text-sm text-muted-foreground">
            Your registered phone number.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">BVN</label>
          <p className="text-sm text-muted-foreground">
            Only last 4 digits displayed.
          </p>
        </div>
      </section>
    </div>
  );
}
