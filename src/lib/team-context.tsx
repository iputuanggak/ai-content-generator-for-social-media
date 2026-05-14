import { createContext, useContext, type ReactNode } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";

interface TeamData {
  userName: string;
  userId: string;
  teamName: string | null;
  teamId: string | null;
  slug: string | null;
  teams: { id: string; name: string; slug: string }[];
}

interface TeamContextValue extends TeamData {
  loading: boolean;
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

  if (!sessionLoading && sessionData && !sessionData.session) {
    router.push("/login");
  }

  if (sessionError && !sessionData) {
    router.push("/login");
  }

  if (slug && !teamLoading && sessionData?.session && !teamData) {
    router.push("/teams");
  }

  const value: TeamContextValue = sessionData?.session
    ? {
        userName: sessionData.userName ?? "",
        userId: sessionData.session?.user?.id ?? "",
        teamName: teamData?.name ?? sessionData.teamName ?? null,
        teamId: teamData?.id ?? sessionData.teamId ?? null,
        slug: slug ?? null,
        teams: sessionData.teams ?? [],
        loading: sessionLoading || (!!slug && teamLoading),
      }
    : {
        userName: "",
        userId: "",
        teamName: null,
        teamId: null,
        slug: null,
        teams: [],
        loading: sessionLoading,
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
