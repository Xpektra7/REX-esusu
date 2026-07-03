export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary p-6">
      <div className="mb-2 text-2xl font-bold">
        {/* Brand logo box */}
        <img
          src="/icon-512.svg"
          alt="Esusu logo"
          className="size-12 text-primary-foreground"
        />
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
