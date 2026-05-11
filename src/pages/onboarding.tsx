import { useState } from "react";
import { useRouter } from "next/router";
import { authClient } from "@/lib/auth-client";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import type { GetServerSideProps } from "next";
import { auth } from "@/lib/auth";

export default function OnboardingPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Create slug from team name
    const slug = teamName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const { error: orgError } = await authClient.organization.create({
      name: teamName,
      slug,
    });

    setLoading(false);

    if (orgError) {
      setError(orgError.message ?? "Failed to create team. Please try again.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <div className="w-full max-w-md rounded-2xl border border-teal-100 bg-white/90 p-8 shadow-lg shadow-teal-100/40 backdrop-blur-sm">
        {/* ContentGen wordmark */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">C</span>
          </div>
          <span className="text-lg font-semibold text-foreground">ContentGen</span>
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-foreground">Create your Team</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Teams let you share brand settings and content history with your colleagues.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="Team name"
            id="teamName"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            placeholder="e.g. Acme Marketing"
          />

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || !teamName.trim()}
            className="mt-2"
          >
            {loading ? "Creating team…" : "Create team"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
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

  return { props: {} };
};
