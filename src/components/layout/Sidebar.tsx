import Link from "next/link";
import { useRouter } from "next/router";
import { authClient } from "@/lib/auth-client";
import { useTeam } from "@/lib/team-context";
import { useCredits } from "@/lib/use-credits";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  SparklesIcon,
  Clock01Icon,
  UserGroupIcon,
  Settings01Icon,
  Coins01Icon,
} from "@hugeicons/core-free-icons";

interface SidebarProps {
  onNavigate?: () => void;
}

const AVATAR_PALETTE = [
  "#0d9488",
  "#6366f1",
  "#e11d48",
  "#d97706",
  "#8b5cf6",
  "#059669",
  "#0284c7",
  "#ea580c",
  "#db2777",
  "#0891b2",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function buildNavLinks(slug: string | null) {
  const base = slug ? `/${slug}` : "/dashboard";
  return [
    { label: "Generate", href: base, icon: SparklesIcon },
    { label: "History", href: `${base}/history`, icon: Clock01Icon },
    { label: "Members", href: `${base}/members`, icon: UserGroupIcon },
    { label: "Settings", href: `${base}/settings`, icon: Settings01Icon },
  ];
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const router = useRouter();
  const { userName, userEmail, teamName, teamId, slug, teams } = useTeam();
  const { data: creditsData } = useCredits();
  const navLinks = buildNavLinks(slug);

  async function handleLogout() {
    try {
      await authClient.signOut();
    } catch {}
    router.push("/login");
  }

  function isActive(href: string) {
    const base = slug ? `/${slug}` : "/dashboard";
    if (href === base) {
      return router.pathname === "/[slug]" || router.pathname === "/dashboard";
    }
    return router.asPath.startsWith(href);
  }

  return (
    <div className="flex h-full flex-col bg-white border-r border-zinc-200">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-100">
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

      <div className="px-5 py-4 border-b border-zinc-100">
        {teamName && teams.length >= 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 outline-none">
              <span className="truncate">{teamName}</span>
              <svg
                className="ml-1 h-3.5 w-3.5 shrink-0 text-zinc-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {teams.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onSelect={() => {
                    if (t.id === teamId) return;
                    const currentPath = router.asPath.replace(/^\/[^/]+/, "");
                    router.push(`/${t.slug}${currentPath}`);
                  }}
                  className={t.id === teamId ? "font-medium text-teal-600" : ""}
                >
                  {t.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => router.push("/create-team")}
                className="text-zinc-500"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={16} />
                Create new team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : teamName ? (
          <span className="block px-2 py-1.5 text-sm font-medium text-zinc-700 truncate">
            {teamName}
          </span>
        ) : (
          <span className="block px-2 py-1.5 text-sm text-zinc-400 italic">No team</span>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navLinks.map(({ label, href, icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={[
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-teal-50 text-teal-700"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
            ].join(" ")}
          >
            <HugeiconsIcon icon={icon} size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {slug && creditsData && (
        <div className="mx-3 mb-3 rounded-lg border border-zinc-200 px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Coins01Icon} size={14} />
              <span className="text-xs text-zinc-500">Credits</span>
            </div>
            <span className="text-sm font-semibold text-zinc-900">{creditsData.available}</span>
          </div>
          <Link
            href={`/${slug}/credits`}
            className="mt-1.5 block text-xs font-medium text-teal-600 hover:text-teal-700"
          >
            Manage
          </Link>
        </div>
      )}

      <div className="border-t border-zinc-100 px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white select-none"
            style={{ backgroundColor: avatarColor(userName) }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-zinc-900 truncate">{userName}</div>
            <div className="text-xs text-zinc-500 truncate">{userEmail}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Log out
        </Button>
      </div>
    </div>
  );
}
