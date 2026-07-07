import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-primary p-6">
      <div className="mb-2 text-2xl font-bold">
        {/* Brand logo box */}
        <img
          src="/icon-512.svg"
          alt="Esusu logo"
          fetchPriority="high"
          decoding="async"
          className="size-12 text-primary-foreground"
        />
      </div>
      <div className="w-fit max-w-sm">{children}</div>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "link" }),
          "text-sm text-foreground",
        )}
      >
        Back to Home
      </Link>
    </div>
  );
}
