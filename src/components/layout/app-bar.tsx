"use client";

import { useAuthStore } from "@/stores/auth-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Notification01Icon } from "hugeicons-react";
import Link from "next/link";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getGreeting(name: string): string {
  const h = new Date().getHours();
  if (h < 12) return `Hi, ${name}`;
  if (h < 17) return `Hello, ${name}`;
  return `Hey, ${name}`;
}

export function AppBar() {
  const user = useAuthStore((s) => s.user);
  const name = user?.name || "User";
  const firstName = name.split(" ")[0];

  return (
    <header className="fixed inset-0 z-50 flex w-full h-16 items-center justify-between bg-background px-5 py-3">
      <div className="flex items-center gap-2">
        <Avatar size="default">
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <p className="text-xs tracking-wide">{getGreeting(firstName)}</p>
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
