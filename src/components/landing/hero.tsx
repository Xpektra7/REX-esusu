"use client";

import { ArrowRight01Icon } from "hugeicons-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CircleDiagram, members } from "@/components/landing/circle-diagram";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const STEP_MS = 1400;

export function Hero() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    let idleId: number | undefined;

    const startTicking = () => {
      timer = setInterval(() => {
        setActiveIndex((i) => (i + 1) % members.length);
      }, STEP_MS);
    };

    const start = () => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(startTicking);
      } else {
        startTicking();
      }
    };

    if (document.readyState === "complete") {
      start();
    } else {
      window.addEventListener("load", start, { once: true });
    }

    return () => {
      clearInterval(timer);
      if (idleId !== undefined && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      window.removeEventListener("load", start);
    };
  }, []);

  return (
    <section className="relative overflow-hidden border-b border-border">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -bottom-10 w-[120%] max-w-3xl text-primary opacity-20"
        viewBox="0 0 300 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0 80 Q 75 20, 150 60 T 300 40"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="landing-container grid gap-10 py-14 md:gap-12 md:py-28 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-8">
        <div className="flex flex-col items-start gap-6 text-left">
          <div className="eyebrow inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-primary">
            Trusted by savers across Nigeria
          </div>

          <h1 className="max-w-xl text-4xl leading-[1.1] font-bold sm:text-5xl sm:leading-[1.05] md:text-6xl">
            Save together,{" "}
            <span className="text-primary italic">transparently</span>
          </h1>

          <p className="max-w-md text-base text-foreground/70 md:text-lg">
            Digital group savings powered by Nomba. Create circles, invite
            members, contribute automatically, and get paid — no paper, no trust
            issues.
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full gap-2 sm:w-auto",
                )}
              >
                Go to Dashboard
                <ArrowRight01Icon className="size-4" />
              </Link>
            ) : (
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full gap-2 sm:w-auto",
                )}
              >
                Start Your Circle
                <ArrowRight01Icon className="size-4" />
              </Link>
            )}
            <Link
              href="/about"
              className="text-sm text-background/60 underline-offset-4 hover:text-background hover:underline"
            >
              About Esusu
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm flex flex-col items-center justify-center">
          <CircleDiagram activeIndex={activeIndex} />
          <p className="mt-4 text-center text-xs md:text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {members[activeIndex]}
            </span>{" "}
            is receiving this cycle · {activeIndex + 1} of {members.length}{" "}
            members paid
          </p>
        </div>
      </div>
    </section>
  );
}
