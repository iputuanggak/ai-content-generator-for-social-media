import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";

interface TeamData {
  userName: string;
  userEmail: string;
  userId: string;
  teamName: string | null;
  teamId: string | null;
  slug: string | null;
  teams: { id: string; name: string; slug: string }[];
}

interface TeamContextValue extends TeamData {
  loading: boolean;
  sessionLoaded: boolean;
  sessionError: boolean;
  teamLoaded: boolean;
  teamData: { id: string; name: string; slug: string } | null;
}

const TeamContext = createContext<TeamContextValue | null>(null);

async function fetchSession() {
  const res = await fetch("/api/session");
  return res.json();
}

async function fetchTeamBySlug(slug: string) {
  const res = await fetch(`/api/teams/resolve?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  return res.json();
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const slug = router.query.slug as string | undefined;

  const { data: sessionData, isLoading: sessionLoading, isError: sessionError } = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
  });

  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ["team", slug],
    queryFn: () => fetchTeamBySlug(slug!),
    enabled: !!slug && !!sessionData?.session,
    staleTime: 5 * 60 * 1000,
  });

  const value: TeamContextValue = sessionData?.session
    ? {
        userName: sessionData.userName ?? "",
        userEmail: sessionData.session?.user?.email ?? "",
        userId: sessionData.session?.user?.id ?? "",
        teamName: teamData?.name ?? sessionData.teamName ?? null,
        teamId: teamData?.id ?? sessionData.teamId ?? null,
        slug: slug ?? null,
        teams: sessionData.teams ?? [],
        loading: sessionLoading || (!!slug && teamLoading),
        sessionLoaded: !sessionLoading,
        sessionError,
        teamLoaded: !teamLoading,
        teamData: teamData ?? null,
      }
    : {
        userName: "",
        userEmail: "",
        userId: "",
        teamName: null,
        teamId: null,
        slug: null,
        teams: [],
        loading: sessionLoading,
        sessionLoaded: !sessionLoading,
        sessionError,
        teamLoaded: !teamLoading,
        teamData: null,
      };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam(): TeamContextValue {
  const ctx = useContext(TeamContext);
  if (!ctx) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return ctx;
}

export function useTeamGuard() {
  const router = useRouter();
  const ctx = useContext(TeamContext);
  if (!ctx) {
    throw new Error("useTeamGuard must be used within a TeamProvider");
  }
  const { sessionLoaded, sessionError, userId, slug, teamLoaded, teamData } = ctx;

  useEffect(() => {
    if (sessionLoaded && !userId) {
      router.push("/login");
      return;
    }
    if (sessionError) {
      router.push("/login");
      return;
    }
    if (slug && teamLoaded && userId && !teamData) {
      router.push("/teams");
    }
  }, [sessionLoaded, sessionError, userId, slug, teamLoaded, teamData, router]);
}
