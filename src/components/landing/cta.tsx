"use client";

import { ArrowRight01Icon } from "hugeicons-react";
import Link from "next/link";
import { CircleDiagram } from "@/components/landing/circle-diagram";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export function Cta() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <section className="border-t border-background/10 bg-foreground py-16 text-background md:py-20">
      <div className="landing-container lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
        <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <h2 className="max-w-xl text-3xl font-bold md:text-4xl">
            Start saving with people you trust
          </h2>
          <p className="max-w-md text-sm text-background/70 md:text-base">
            Your first circle takes less than five minutes to set up.
          </p>
          <Link
            href={isAuthenticated ? "/dashboard" : "/signup"}
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            {isAuthenticated ? "Go to Dashboard" : "Create Your Circle"}
            <ArrowRight01Icon className="size-4" />
          </Link>
        </div>

        <div className="mt-10 hidden lg:block">
          <CircleDiagram activeIndex={0} />
        </div>
      </div>
    </section>
  );
}
