import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function AcceptInvitationPage() {
  const router = useRouter();
  const { invitationId } = router.query;
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    authClient.getSession().then((result) => {
      setIsLoggedIn(!!result.data?.user);
    });
  }, []);

  async function handleAccept() {
    if (!invitationId || typeof invitationId !== "string") return;
    setStatus("loading");
    setError(null);

    try {
      const result = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (result.error) {
        setError(result.error.message ?? "Failed to accept invitation");
        setStatus("error");
      } else {
        setStatus("success");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (isLoggedIn === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold text-zinc-900">Accept Invitation</h1>
          <p className="mb-6 text-sm text-zinc-500">
            You need to sign in or create an account to accept this invitation.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/login?invitationId=${invitationId ?? ""}`}
              className="block w-full rounded-lg bg-zinc-900 px-6 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Sign in
            </Link>
            <Link
              href={`/register?invitationId=${invitationId ?? ""}`}
              className="block w-full rounded-lg border border-zinc-200 px-6 py-2.5 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">Accept Invitation</h1>

        {status === "success" ? (
          <p className="text-sm text-zinc-600">
            You have successfully joined the team. Redirecting to dashboard…
          </p>
        ) : (
          <>
            <p className="mb-6 text-sm text-zinc-500">
              You have been invited to join a team. Click below to accept.
            </p>

            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}

            <button
              onClick={handleAccept}
              disabled={status === "loading" || !invitationId}
              className="w-full rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "loading" ? "Accepting…" : "Accept Invitation"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
