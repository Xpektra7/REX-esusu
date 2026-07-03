import dynamic from "next/dynamic";
import { AppBar } from "@/components/layout/app-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Providers } from "@/components/shared/providers";

const SideNav = dynamic(
  () => import("@/components/layout/side-nav").then((m) => m.SideNav),
);

const RightPanel = dynamic(
  () => import("@/components/layout/right-panel").then((m) => m.RightPanel),
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col bg-background lg:flex-row">
        <div className="hidden lg:block lg:w-60 xl:w-68 shrink-0">
          <div className="sticky top-0 h-screen">
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

        <div className="hidden lg:block lg:w-80 xl:w-88 shrink-0">
          <div className="sticky top-0 h-screen">
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
