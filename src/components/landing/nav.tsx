import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-bold">
          Esusu
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/about"
            className="text-sm text-muted-foreground  hover:text-foreground"
          >
            About
          </Link>
          <Link
            href="/faq"
            className="text-sm text-muted-foreground hover:text-foreground "
          >
            FAQ
          </Link>
          <Link
            href="/signin"
            className={cn(buttonVariants({ size: "sm" }), "")}
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
