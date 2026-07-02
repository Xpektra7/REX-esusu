import { AppBar } from "@/components/layout/app-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Providers } from "@/components/shared/providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="flex min-h-screen flex-col bg-background">
        <AppBar />
        <main className="flex-1 px-5 pt-16 pb-20">{children}</main>
        <BottomNav />
      </div>
    </Providers>
  );
}
