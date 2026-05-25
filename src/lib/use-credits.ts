import { useQuery } from "@tanstack/react-query";
import { useTeam } from "@/lib/team-context";

interface CreditsResponse {
  available: number;
  expiringSoon: { id: string; remaining: number; expiresAt: string }[];
}

export function useCredits() {
  const { slug } = useTeam();

  return useQuery<CreditsResponse>({
    queryKey: ["credits", slug],
    queryFn: async () => {
      const res = await fetch(`/api/${slug}/credits`);
      if (!res.ok) throw new Error("Failed to fetch credits");
      return res.json();
    },
    enabled: !!slug,
    staleTime: 60 * 1000,
  });
}
