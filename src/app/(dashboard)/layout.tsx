import Link from "next/link";
import {
  Home01Icon,
  UserGroupIcon,
  Wallet01Icon,
  Notification01Icon,
  Settings01Icon,
  Logout01Icon,
} from "hugeicons-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home01Icon },
  { href: "/circles", label: "Circles", icon: UserGroupIcon },
  { href: "/wallet", label: "Wallet", icon: Wallet01Icon },
  { href: "/notifications", label: "Notifications", icon: Notification01Icon },
  { href: "/profile", label: "Profile", icon: Settings01Icon },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link href="/dashboard" className="text-lg font-bold">
            Esusu
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <Link
            href="/auth"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Logout01Icon className="size-4" />
            Sign Out
          </Link>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-border px-6 md:hidden">
          <Link href="/dashboard" className="text-lg font-bold">
            Esusu
          </Link>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
