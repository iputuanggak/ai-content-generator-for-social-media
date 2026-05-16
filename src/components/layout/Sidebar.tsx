import Link from "next/link";
import { useRouter } from "next/router";
import { authClient } from "@/lib/auth-client";
import { useTeam } from "@/lib/team-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  onNavigate?: () => void;
}

function buildNavLinks(slug: string | null) {
  const base = slug ? `/${slug}` : "/dashboard";
  return [
    { label: "Generate", href: base },
    { label: "History", href: `${base}/history` },
    { label: "Members", href: `${base}/members` },
    { label: "Settings", href: `${base}/settings` },
  ];
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const router = useRouter();
  const { userName, teamName, teamId, slug, teams } = useTeam();
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
    return router.pathname.startsWith(href);
  }

  return (
    <div className="flex h-full flex-col bg-white border-r border-zinc-200">
      <div className="px-5 py-5 border-b border-zinc-100">
        <span className="text-lg font-semibold text-zinc-900">ContentGen</span>
      </div>

      <div className="px-5 py-4 border-b border-zinc-100">
        {teamName && teams.length > 1 ? (
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
        {navLinks.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={[
              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-teal-50 text-teal-700"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
            ].join(" ")}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-zinc-100 px-5 py-4">
        <div className="mb-2 text-sm font-medium text-zinc-900 truncate">{userName}</div>
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
