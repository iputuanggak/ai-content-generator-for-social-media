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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <div className="flex flex-col items-center gap-4">
          {/* Pulsing ContentGen logo */}
          <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
            <span className="text-xl font-bold text-primary-foreground">C</span>
          </div>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
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

          <h1 className="mb-2 text-2xl font-semibold text-foreground">Accept Invitation</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            You need to sign in or create an account to accept this invitation.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/login?invitationId=${invitationId ?? ""}`}
              className="block w-full rounded-lg bg-primary px-6 py-2.5 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign in
            </Link>
            <Link
              href={`/register?invitationId=${invitationId ?? ""}`}
              className="block w-full rounded-lg border border-border px-6 py-2.5 text-center text-sm font-medium text-foreground/70 transition-colors hover:bg-muted"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
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

        <h1 className="mb-2 text-2xl font-semibold text-foreground">Accept Invitation</h1>

        {status === "success" ? (
          <p className="text-sm text-muted-foreground">
            You have successfully joined the team. Redirecting to dashboard…
          </p>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              You have been invited to join a team. Click below to accept.
            </p>

            {error && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
            )}

            <button
              onClick={handleAccept}
              disabled={status === "loading" || !invitationId}
              className="w-full rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "loading" ? "Accepting…" : "Accept Invitation"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
