import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = (router.query.token as string) ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    let valid = true;
    setPasswordError("");
    setConfirmError("");

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      valid = false;
    }

    return valid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    setLoading(true);

    const { error: resetError } = await authClient.resetPassword({
      newPassword,
      token,
    });

    setLoading(false);

    if (resetError) {
      setSubmitError(
        "This reset link is invalid or has expired. Please request a new one."
      );
      return;
    }

    router.push("/login?reset=success");
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

        <h1 className="mb-2 text-2xl font-semibold text-foreground">Set new password</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField
            label="New password"
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setPasswordError("");
            }}
            error={passwordError}
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-2 top-1/2 -mt-3"
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              <HugeiconsIcon icon={showNewPassword ? ViewOffIcon : ViewIcon} size={16} />
            </Button>
          </FormField>

          <FormField
            label="Confirm password"
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setConfirmError("");
            }}
            error={confirmError}
            required
            autoComplete="new-password"
            placeholder="Repeat your password"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-1/2 -mt-3"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              <HugeiconsIcon icon={showConfirmPassword ? ViewOffIcon : ViewIcon} size={16} />
            </Button>
          </FormField>

          {submitError && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              <p>{submitError}</p>
              <Link
                href="/forgot-password"
                className="mt-1 inline-block font-medium underline underline-offset-2 hover:text-destructive/80"
              >
                Request a new reset link
              </Link>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="mt-2"
          >
            {loading ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
