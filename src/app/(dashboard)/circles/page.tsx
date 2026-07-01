import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CirclesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Circles</h1>
        <div className="flex gap-2">
          <Link
            href="/circles/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Create Circle
          </Link>
          <Link
            href="/circles/join"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Join Circle
          </Link>
        </div>
      </div>
      <div className="mt-8">
        <p className="text-sm text-muted-foreground">
          No circles yet. Create or join one to start saving.
        </p>
      </div>
    </div>
  );
}
