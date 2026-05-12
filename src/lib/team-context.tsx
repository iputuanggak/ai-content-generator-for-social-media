import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/router";

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

export function TeamProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [data, setData] = useState<TeamData>({
    userName: "",
    userId: "",
    teamName: null,
    teamId: null,
    teams: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/session")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.session) {
          router.push("/login");
          return;
        }
        setData({
          userName: json.userName ?? "",
          userId: json.session?.user?.id ?? "",
          teamName: json.teamName ?? null,
          teamId: json.teamId ?? null,
          teams: json.teams ?? [],
        });
      })
      .catch(() => {
        if (!cancelled) router.push("/login");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <TeamContext.Provider value={{ ...data, loading }}>
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
