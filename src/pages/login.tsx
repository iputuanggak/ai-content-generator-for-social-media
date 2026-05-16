import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }

    queryClient.removeQueries({ queryKey: ["session"] });

    try {
      const res = await fetch("/api/session");
      const data = await res.json();

      // Check email verification status
      const emailVerified = data.session?.user?.emailVerified;
      const { invitationId } = router.query;

      if (!emailVerified) {
        // Auto-send OTP and redirect to verification page
        await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, purpose: "email_verification" }),
        });
        const params = new URLSearchParams({ email });
        if (invitationId && typeof invitationId === "string") {
          params.set("invitationId", invitationId);
        }
        router.push(`/verify-email?${params.toString()}`);
        return;
      }

      // If arriving from an invitation link, redirect back to accept it
      if (invitationId && typeof invitationId === "string") {
        router.push(`/accept-invitation?invitationId=${invitationId}`);
        return;
      }

      const userTeams: { id: string; name: string; slug: string | null }[] =
        data.teams ?? [];

      if (userTeams.length === 0) {
        router.push("/onboarding");
      } else if (userTeams.length === 1) {
        const slug = userTeams[0].slug ?? userTeams[0].id;
        router.push(`/${slug}`);
      } else {
        router.push("/teams");
      }
    } catch {
      router.push("/teams");
    }
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

        <h1 className="mb-2 text-2xl font-semibold text-foreground">Sign in</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary underline underline-offset-2 hover:text-primary/80">
            Create one
          </Link>
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

          <FormField
            label="Password"
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Your password"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -mt-3"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} size={16} />
            </Button>
          </FormField>

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
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
