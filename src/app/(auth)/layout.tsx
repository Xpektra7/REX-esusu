import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-6">
      <Link href="/" className="mb-8 text-2xl font-bold">
        Esusu
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6">
        {children}
      </div>
    </div>
  );
}
