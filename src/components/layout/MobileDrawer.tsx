import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";

interface MobileDrawerProps {
  userName: string;
  teamName: string | null;
  teamId: string | null;
  teams: { id: string; name: string }[];
}

export function MobileDrawer({ userName, teamName, teamId, teams }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
      {/* Hamburger + logo */}
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open navigation"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar
              userName={userName}
              teamName={teamName}
              teamId={teamId}
              teams={teams}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <span className="text-base font-semibold text-zinc-900">ContentGen</span>
      </div>
    </div>
  );
}
