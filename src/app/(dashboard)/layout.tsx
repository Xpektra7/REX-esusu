import { AppBar } from "@/components/layout/app-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { RightPanel } from "@/components/layout/right-panel";
import { SideNav } from "@/components/layout/side-nav";
import { Providers } from "@/components/shared/providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="flex min-h-screen flex-col bg-background lg:flex-row">
        <div className="hidden lg:block lg:w-56 xl:w-64 shrink-0">
          <div className="fixed left-0 top-0 h-full w-56 xl:w-64">
            <SideNav />
          </div>
        </div>

        <div className="flex min-h-screen flex-1 flex-col">
          <div className="lg:hidden">
            <AppBar />
          </div>
          <main className="flex-1 px-5 pt-16 pb-20 lg:pb-6 lg:pt-6">
            {children}
          </main>
        </div>

        <div className="hidden lg:block lg:w-72 xl:w-80 shrink-0">
          <div className="fixed right-0 top-0 h-full w-72 xl:w-80">
            <RightPanel />
          </div>
        </div>

        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </Providers>
  );
}
