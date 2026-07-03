"use client";

import {
  ArrowUp01Icon,
  PlusSignIcon,
  ViewIcon,
  ViewOffIcon,
} from "hugeicons-react";
import Link from "next/link";
import { useState } from "react";
import { cn, formatNaira } from "@/lib/utils";

export function WalletCard({ balance }: { balance: number }) {
  const [hidden, setHidden] = useState(false);

  return (
    <section className="relative overflow-hidden rounded-xl bg-primary p-5">
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-xs tracking-widest text-card-foreground/80">
            Available Balance
          </p>
          <button
            type="button"
            onClick={() => setHidden(!hidden)}
            aria-label={hidden ? "Show balance" : "Hide balance"}
            className="flex items-center justify-center"
          >
            {hidden ? (
              <ViewOffIcon className="size-4 text-card-foreground/60" />
            ) : (
              <ViewIcon className="size-4 text-card-foreground/60" />
            )}
          </button>
        </div>

        <p className="py-3 text-3xl font-heading font-semibold text-card-foreground">
          {hidden ? "****" : formatNaira(balance, 2)}
        </p>

        <div className="flex gap-3">
          <Link
            href="/wallet"
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3",
              "bg-card-foreground text-card text-xs font-bold tracking-wider",
              "hover:opacity-90 transition-opacity",
            )}
          >
            <PlusSignIcon className="size-4" />
            Top Up
          </Link>
          <Link
            href="/wallet/withdraw"
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3",
              "bg-background text-card-foreground text-xs font-bold tracking-wider",
              "hover:opacity-90 transition-opacity",
            )}
          >
            <ArrowUp01Icon className="size-4" />
            Send
          </Link>
        </div>
      </div>
    </section>
  );
}
