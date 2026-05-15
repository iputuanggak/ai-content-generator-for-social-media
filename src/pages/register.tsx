import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { isDisposableEmail } from "@/lib/disposable-email";

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isDisposableEmail(email)) {
      setError("This email provider is not supported. Please use a permanent email address.");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message ?? "Registration failed. Please try again.");
      return;
    }

    queryClient.removeQueries({ queryKey: ["session"] });

    // Send OTP and redirect to email verification
    await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, purpose: "email_verification" }),
    });

    const { invitationId } = router.query;
    const verifyUrl =
      invitationId && typeof invitationId === "string"
        ? `/verify-email?email=${encodeURIComponent(email)}&invitationId=${invitationId}`
        : `/verify-email?email=${encodeURIComponent(email)}`;
    router.push(verifyUrl);
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

        <h1 className="mb-2 text-2xl font-semibold text-foreground">Create your account</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary underline underline-offset-2 hover:text-primary/80">
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="Name"
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Your full name"
          />

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
            autoComplete="new-password"
            minLength={8}
            placeholder="Min. 8 characters"
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
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
