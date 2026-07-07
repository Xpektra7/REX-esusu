import dynamic from "next/dynamic";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppPinScreen } from "@/components/shared/app-pin-screen";
import { Providers } from "@/components/shared/providers";

const SideNav = dynamic(() =>
  import("@/components/layout/side-nav").then((m) => m.SideNav),
);

const RightPanel = dynamic(() =>
  import("@/components/layout/right-panel").then((m) => m.RightPanel),
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <AppPinScreen>
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col bg-background md:flex-row">
          <div className="hidden md:block md:w-64 lg:w-60 xl:w-68 shrink-0">
            <div className="sticky top-0 h-screen">
              <SideNav />
            </div>
          </div>

          <main className="min-h-screen flex-1 px-5 pt-16 pb-20 md:pb-6 md:pt-6">
            {children}
          </main>

          <div className="hidden lg:block lg:w-72 xl:w-88 shrink-0">
            <div className="sticky top-0 h-screen">
              <RightPanel />
            </div>
          </div>

          <div className="md:hidden">
            <BottomNav />
          </div>
        </div>
      </AppPinScreen>
    </Providers>
  );
}
