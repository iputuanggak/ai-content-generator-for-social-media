import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "./Sidebar";
import { MobileDrawer } from "./MobileDrawer";

interface DashboardLayoutProps {
  children: ReactNode;
  userName: string;
  teamName: string | null;
  teamId: string | null;
  teams: { id: string; name: string }[];
}

export function DashboardLayout({
  children,
  userName,
  teamName,
  teamId,
  teams,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Desktop sidebar — fixed 240px, hidden on mobile */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 md:block">
        <Sidebar
          userName={userName}
          teamName={teamName}
          teamId={teamId}
          teams={teams}
        />
      </aside>

      {/* Mobile top bar + drawer */}
      <MobileDrawer
        userName={userName}
        teamName={teamName}
        teamId={teamId}
        teams={teams}
      />

      {/* Page content — offset by sidebar on desktop */}
      <div className="md:pl-60">
        {children}
      </div>

      <Toaster />
    </div>
  );
}
