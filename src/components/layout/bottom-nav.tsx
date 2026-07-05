"use client";

import {
  Home01Icon,
  UserGroupIcon,
  UserIcon,
  Wallet01Icon,
} from "hugeicons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home01Icon },
  { href: "/circles", label: "Circles", icon: UserGroupIcon },
  { href: "/wallet", label: "Wallet", icon: Wallet01Icon },
  { href: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full p-2">
      <div className="flex w-full items-center justify-around rounded-xl border-t border-border bg-card-foreground px-4 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors",
                isActive
                  ? "font-bold text-primary"
                  : "text-muted-foreground hover:text-card",
              )}
            >
              <div className={cn("relative", isActive && "")}>
                <Icon className="size-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
