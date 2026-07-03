import { ArrowRight01Icon } from "hugeicons-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-20 text-center md:py-28">
        <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
          Trusted by savers across Nigeria
        </div>

        <h1 className="max-w-3xl text-5xl font-bold font-sans leading-tight md:text-6xl lg:text-7xl">
          Save together,{" "}
          <span className="italic text-primary">transparently</span>
        </h1>

        <p className="max-w-xl text-base text-muted-foreground md:text-lg">
          Digital group savings powered by Nomba. Create circles, invite
          members, contribute automatically, and get paid — no paper, no trust
          issues.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signin"
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            Start Your Circle
            <ArrowRight01Icon className="size-4" />
          </Link>
          <Link
            href="/about"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Explore Public Circles
          </Link>
        </div>
      </div>
    </section>
  );
}
