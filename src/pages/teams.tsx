import Link from "next/link";
import type { GetServerSideProps } from "next";
import { auth } from "@/lib/auth";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { useRequireVerifiedEmail } from "@/lib/use-require-verified-email";

interface Team {
  id: string;
  name: string;
  slug: string | null;
}

interface TeamsPageProps {
  teams: Team[];
  userName: string | null;
}

export default function TeamsPage({ teams, userName }: TeamsPageProps) {
  const { loading } = useRequireVerifiedEmail();
  if (loading) return null;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <div className="w-full max-w-md rounded-2xl border border-teal-100 bg-white/90 p-8 shadow-lg shadow-teal-100/40 backdrop-blur-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">Lo</span>
          </div>
          <span className="text-lg font-semibold text-foreground">Lotus</span>
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          Pick a team
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {userName ? `Hi ${userName}, ` : ""}select a team to continue.
        </p>

        <div className="flex flex-col gap-3">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/${team.slug ?? team.id}`}
              className="group flex items-center gap-3 rounded-xl border border-teal-100 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/10"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <HugeiconsIcon icon={UserGroupIcon} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {team.name}
                </p>
                {team.slug && (
                  <p className="truncate text-xs text-muted-foreground">
                    {team.slug}
                  </p>
                )}
              </div>
              <span className="text-muted-foreground transition-colors group-hover:text-primary">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<TeamsPageProps> = async ({
  req,
}) => {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  const session = await auth.api.getSession({ headers });

  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const allOrgs = await auth.api.listOrganizations({ headers });
  const teams: Team[] = (allOrgs ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug ?? null,
  }));

  if (teams.length === 0) {
    return { redirect: { destination: "/onboarding", permanent: false } };
  }

  if (teams.length === 1) {
    const slug = teams[0].slug ?? teams[0].id;
    return { redirect: { destination: `/${slug}`, permanent: false } };
  }

  return {
    props: {
      teams,
      userName: session.user.name ?? null,
    },
  };
};
