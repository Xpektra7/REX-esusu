"use client";

import {
  Home01Icon,
  Logout01Icon,
  Notification01Icon,
  UserGroupIcon,
  UserIcon,
  Wallet01Icon,
} from "hugeicons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home01Icon },
  { href: "/circles", label: "Circles", icon: UserGroupIcon },
  { href: "/wallet", label: "Wallet", icon: Wallet01Icon },
  { href: "/profile", label: "Profile", icon: UserIcon },
  { href: "/notifications", label: "Notifications", icon: Notification01Icon },
] as const;

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore */
    }
    clearAuth();
    router.push("/signin");
  };

  return (
    <aside className="flex h-full flex-col border-r border-border bg-background">
      <div className="flex items-center gap-3 px-6 py-5">
        <img
          src="/icon-512.svg"
          alt="Esusu"
          fetchPriority="high"
          decoding="async"
          className="size-9 shrink-0"
        />
        <span className="text-lg font-bold">Esusu</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href) || (item.href === "/dashboard" && pathname === "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Logout01Icon className="size-5 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
