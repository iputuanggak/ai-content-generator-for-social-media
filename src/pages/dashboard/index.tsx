import { useRouter } from "next/router";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { auth } from "@/lib/auth";
import type { GetServerSideProps } from "next";

interface DashboardProps {
  userName: string;
  teamName: string | null;
}

export default function DashboardPage({ userName, teamName }: DashboardProps) {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header / nav */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-zinc-900">AI Content Generator</span>
            {teamName && (
              <>
                <span className="text-zinc-300">/</span>
                <span className="text-sm font-medium text-zinc-600">{teamName}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{userName}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">
          Welcome, {userName}!
        </h1>
        {teamName ? (
          <p className="text-zinc-500">
            You&apos;re working in the <strong>{teamName}</strong> team.
          </p>
        ) : (
          <p className="text-zinc-500">
            You have no team yet.{" "}
            <Link href="/onboarding" className="font-medium text-zinc-900 underline underline-offset-2">
              Create one
            </Link>
            .
          </p>
        )}
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<DashboardProps> = async ({ req }) => {
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

  // Fetch the active organization name if there is one
  let teamName: string | null = null;
  const activeOrgId = session.session.activeOrganizationId;

  if (activeOrgId) {
    const orgsResponse = await auth.api.getFullOrganization({
      headers,
      query: { organizationId: activeOrgId },
    });
    if (orgsResponse && orgsResponse.name) {
      teamName = orgsResponse.name;
    }
  }

  // If no active org, try to get first org the user belongs to
  if (!teamName) {
    const listResponse = await auth.api.listOrganizations({ headers });
    if (listResponse && listResponse.length > 0) {
      teamName = listResponse[0].name;
      // Set the active organization in the session
      await auth.api.setActiveOrganization({
        headers,
        body: { organizationId: listResponse[0].id },
      });
    }
  }

  return {
    props: {
      userName: session.user.name,
      teamName,
    },
  };
};
