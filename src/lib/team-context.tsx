import { createContext, useContext, type ReactNode } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";

interface TeamData {
  userName: string;
  userId: string;
  teamName: string | null;
  teamId: string | null;
  teams: { id: string; name: string }[];
}

interface TeamContextValue extends TeamData {
  loading: boolean;
}

const TeamContext = createContext<TeamContextValue | null>(null);

async function fetchSession() {
  const res = await fetch("/api/session");
  return res.json();
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
  });

  if (!isLoading && data && !data.session) {
    router.push("/login");
  }

  if (isError && !data) {
    router.push("/login");
  }

  const value: TeamContextValue = data?.session
    ? {
        userName: data.userName ?? "",
        userId: data.session?.user?.id ?? "",
        teamName: data.teamName ?? null,
        teamId: data.teamId ?? null,
        teams: data.teams ?? [],
        loading: false,
      }
    : {
        userName: "",
        userId: "",
        teamName: null,
        teamId: null,
        teams: [],
        loading: isLoading,
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
