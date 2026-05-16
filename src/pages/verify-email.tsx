import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { getSmartRedirectLogic } from "@/lib/smart-redirect";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { email: queryEmail, invitationId } = router.query;
  const { data: sessionData, refetch: refetchSession } = authClient.useSession();

  const email =
    queryEmail && typeof queryEmail === "string"
      ? queryEmail
      : sessionData?.user?.email ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [success, setSuccess] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCooldown(60);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startCooldown]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!email || typeof email !== "string") return;
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, purpose: "email_verification" }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setSuccess(true);
      await refetchSession();
      if (invitationId && typeof invitationId === "string") {
        router.push(`/accept-invitation?invitationId=${invitationId}`);
        return;
      }
      try {
        const sessionRes = await fetch("/api/session");
        const sessionData = await sessionRes.json();
        const teams: Array<{ id: string; slug: string | null }> =
          sessionData.teams ?? [];
        const destination = getSmartRedirectLogic(teams);
        router.push(destination);
      } catch {
        router.push("/onboarding");
      }
      return;
    }

    if (data.error === "expired") {
      setError("Your code has expired. Please request a new one.");
    } else if (data.error === "too_many_attempts") {
      setError("Too many incorrect attempts. Please request a new code.");
    } else if (data.error === "invalid") {
      const remaining = data.attemptsRemaining;
      setError(
        remaining !== undefined
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Incorrect code."
      );
    } else {
      setError("Verification failed. Please try again.");
    }
  }

  async function handleResend() {
    if (!email || typeof email !== "string" || cooldown > 0) return;
    setResendLoading(true);
    setError("");

    const res = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "email_verification" }),
    });

    const data = await res.json();
    setResendLoading(false);

    if (res.status === 429 && data.cooldownRemainingSeconds) {
      startCooldown(data.cooldownRemainingSeconds);
      return;
    }

    if (!res.ok) {
      setError(data.error ?? "Failed to resend code. Please try again.");
      return;
    }

    startCooldown(60);
    setCode("");
  }

  const maskedEmail =
    email && typeof email === "string"
      ? email.replace(/(.{2}).+(@.+)/, "$1***$2")
      : "your email";

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

        <h1 className="mb-2 text-2xl font-semibold text-foreground">Check your email</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium text-foreground">{maskedEmail}</span>.
          Enter it below to verify your account.
        </p>

        <div className="mb-4 flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2">
          <span className="mt-0.5 text-sm text-primary">ℹ</span>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Tip:</span> Can&rsquo;t find the email? Check your spam or junk folder. It may take up to a minute to arrive.
          </p>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="code" className="text-sm font-medium text-foreground">
              Verification code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              placeholder="000000"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-center text-2xl font-bold tracking-[0.5em] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring"
              autoComplete="one-time-code"
              disabled={loading || success}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || code.length !== 6 || success}
            className="mt-2"
          >
            {loading ? "Verifying…" : "Verify"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          {cooldown > 0 ? (
            <p className="text-sm text-muted-foreground">
              Wait{" "}
              <span className="font-medium text-foreground tabular-nums">{cooldown}s</span>{" "}
              to resend code
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-sm font-medium text-primary underline underline-offset-2 hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendLoading ? "Sending…" : "Resend code"}
            </button>
          )}
        </div>

        <div className="mt-6 border-t border-border pt-4 text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={async () => {
              await authClient.signOut();
              router.push("/login");
            }}
          >
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
