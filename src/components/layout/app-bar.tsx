"use client";

import { Notification01Icon } from "hugeicons-react";
import Link from "next/link";
import { DiceBearAvatar } from "@/components/shared/dicebear-avatar";
import { getGreeting } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export function AppBar() {
  const user = useAuthStore((s) => s.user);
  const name = user?.name || "User";
  const firstName = name.split(" ")[0];

  return (
    <header className="fixed inset-0 z-50 flex w-full h-16 items-center justify-between bg-background px-5 py-3">
      <div className="flex items-center gap-2">
        <DiceBearAvatar name={name} />
        <p className="text-sm tracking-wide">{getGreeting(firstName)}</p>
      </div>
      <Link
        href="/notifications"
        className="flex size-8 items-center justify-center rounded-full"
      >
        <Notification01Icon className="size-5 text-card-foreground" />
      </Link>
    </header>
  );
}
