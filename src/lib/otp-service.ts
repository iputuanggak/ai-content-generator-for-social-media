import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { emailOtp } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;

export type OtpPurpose = "email_verification" | "password_reset";

export interface OtpResult {
  success: boolean;
  error?: "expired" | "invalid" | "too_many_attempts" | "cooldown";
  attemptsRemaining?: number;
  cooldownRemainingSeconds?: number;
}

/**
 * Generates a random 6-digit OTP code as a string (zero-padded).
 */
export function generateOtpCode(): string {
  const code = Math.floor(Math.random() * 1_000_000);
  return code.toString().padStart(6, "0");
}

/**
 * Creates a new OTP for the given email+purpose, invalidating any existing one.
 * Enforces a 60-second cooldown based on createdAt of the previous OTP.
 * Returns the generated code so the caller can send it via email.
 */
export async function createOtp(
  email: string,
  purpose: OtpPurpose,
  dbClient: typeof db = db
): Promise<{ code: string } | { error: "cooldown"; cooldownRemainingSeconds: number }> {
  const existing = await dbClient.query.emailOtp.findFirst({
    where: and(eq(emailOtp.email, email), eq(emailOtp.purpose, purpose)),
  });

  if (existing) {
    const elapsed = Date.now() - existing.createdAt.getTime();
    if (elapsed < OTP_COOLDOWN_MS) {
      const remaining = Math.ceil((OTP_COOLDOWN_MS - elapsed) / 1000);
      return { error: "cooldown", cooldownRemainingSeconds: remaining };
    }
    // Invalidate previous OTP
    await dbClient.delete(emailOtp).where(eq(emailOtp.id, existing.id));
  }

  const code = generateOtpCode();
  const now = new Date();
  await dbClient.insert(emailOtp).values({
    id: randomUUID(),
    email,
    code,
    purpose,
    attempts: 0,
    expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS),
    createdAt: now,
  });

  return { code };
}

/**
 * Validates an OTP for the given email+purpose+code.
 * Increments attempts on wrong guess. Invalidates after MAX_ATTEMPTS.
 * Deletes the OTP on success.
 */
export async function validateOtp(
  email: string,
  purpose: OtpPurpose,
  code: string,
  dbClient: typeof db = db
): Promise<OtpResult> {
  const otp = await dbClient.query.emailOtp.findFirst({
    where: and(eq(emailOtp.email, email), eq(emailOtp.purpose, purpose)),
  });

  if (!otp) {
    return { success: false, error: "invalid" };
  }

  if (new Date() > otp.expiresAt) {
    await dbClient.delete(emailOtp).where(eq(emailOtp.id, otp.id));
    return { success: false, error: "expired" };
  }

  if (otp.code !== code) {
    const newAttempts = otp.attempts + 1;
    if (newAttempts >= MAX_ATTEMPTS) {
      await dbClient.delete(emailOtp).where(eq(emailOtp.id, otp.id));
      return { success: false, error: "too_many_attempts", attemptsRemaining: 0 };
    }
    await dbClient
      .update(emailOtp)
      .set({ attempts: newAttempts })
      .where(eq(emailOtp.id, otp.id));
    return {
      success: false,
      error: "invalid",
      attemptsRemaining: MAX_ATTEMPTS - newAttempts,
    };
  }

  // Valid — delete the OTP
  await dbClient.delete(emailOtp).where(eq(emailOtp.id, otp.id));
  return { success: true };
}

/**
 * Resend an OTP — same as createOtp but exported as a named alias for clarity.
 */
export const resendOtp = createOtp;
