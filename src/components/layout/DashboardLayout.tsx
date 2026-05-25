import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TeamProvider, useTeamGuard, useTeam } from "@/lib/team-context";
import { Sidebar } from "./Sidebar";
import { MobileDrawer } from "./MobileDrawer";
import { LowCreditBanner } from "@/components/low-credit-banner";

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardLayoutInner({ children }: DashboardLayoutProps) {
  useTeamGuard();
  const { slug } = useTeam();
  return (
    <div className="min-h-screen bg-zinc-50">
      <aside className="fixed inset-y-0 left-0 hidden w-60 md:block">
        <Sidebar />
      </aside>

      <MobileDrawer />

      <div className="md:pl-60">
        {slug && <LowCreditBanner slug={slug} />}
        {children}
      </div>

      <Toaster />
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <TeamProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </TeamProvider>
  );
}
