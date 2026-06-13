import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: resetError } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError("Something went wrong. Please try again.");
      return;
    }

    setSubmitted(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      <div className="w-full max-w-md rounded-2xl border border-teal-100 bg-white/90 p-8 shadow-lg shadow-teal-100/40 backdrop-blur-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">Lo</span>
          </div>
          <span className="text-lg font-semibold text-foreground">Lotus</span>
        </div>

        {submitted ? (
          <>
            <h1 className="mb-2 text-2xl font-semibold text-foreground">Check your email</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
            </p>
            <Link
              href="/login"
              className="inline-block text-sm font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-2xl font-semibold text-foreground">Forgot password?</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FormField
                label="Email"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />

              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="mt-2"
              >
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link
                href="/login"
                className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
