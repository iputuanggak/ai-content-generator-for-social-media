import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";
import { useTeam } from "@/lib/team-context";

export function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const { loading } = useTeam();

  if (loading) {
    return (
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className="text-primary"
          >
            <path
              d="M16 4C16 4 22 10 22 18C22 23 19 27 16 28C13 27 10 23 10 18C10 10 16 4 16 4Z"
              fill="currentColor"
            />
            <path
              d="M8 10C8 10 4 14 4 20C4 24 6 27 9 28C10 26 11 23 11 20C11 15 8 10 8 10Z"
              fill="currentColor"
            />
            <path
              d="M24 10C24 10 21 15 21 20C21 23 22 26 23 28C26 27 28 24 28 20C28 14 24 10 24 10Z"
              fill="currentColor"
            />
          </svg>
          <span className="font-heading text-xl text-foreground">Lotus</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
      <div className="flex items-center gap-2.5">
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
          className="text-primary"
        >
          <path
            d="M16 4C16 4 22 10 22 18C22 23 19 27 16 28C13 27 10 23 10 18C10 10 16 4 16 4Z"
            fill="currentColor"
          />
          <path
            d="M8 10C8 10 4 14 4 20C4 24 6 27 9 28C10 26 11 23 11 20C11 15 8 10 8 10Z"
            fill="currentColor"
          />
          <path
            d="M24 10C24 10 21 15 21 20C21 23 22 26 23 28C26 27 28 24 28 20C28 14 24 10 24 10Z"
            fill="currentColor"
          />
        </svg>
        <span className="font-heading text-xl text-foreground">Lotus</span>
      </div>
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
        <SheetContent side="right" className="p-0 w-64">
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
