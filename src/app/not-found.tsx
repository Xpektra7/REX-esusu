import Link from "next/link";
import { Illustration } from "@/components/shared/illustration";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background p-6">
      <Illustration name="not-found" className="size-90" />
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="max-w-xs text-center text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button render={<Link href="/dashboard" />} nativeButton={false}>
        Go home
      </Button>
    </div>
  );
}
