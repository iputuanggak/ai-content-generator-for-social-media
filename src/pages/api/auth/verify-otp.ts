import type { NextApiRequest, NextApiResponse } from "next";
import { validateOtp, type OtpPurpose } from "@/lib/otp-service";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, code, purpose } = req.body as {
    email?: string;
    code?: string;
    purpose?: string;
  };

  if (!email || !code || !purpose) {
    return res.status(400).json({ error: "email, code, and purpose are required" });
  }

  const validPurposes: OtpPurpose[] = ["email_verification", "password_reset"];
  if (!validPurposes.includes(purpose as OtpPurpose)) {
    return res.status(400).json({ error: "Invalid purpose" });
  }

  const result = await validateOtp(email, purpose as OtpPurpose, code);

  if (!result.success) {
    const statusCode =
      result.error === "too_many_attempts" ? 429 : result.error === "expired" ? 410 : 400;
    return res.status(statusCode).json(result);
  }

  // On successful email_verification, set emailVerified = true
  if (purpose === "email_verification") {
    await db.update(user).set({ emailVerified: true }).where(eq(user.email, email));
  }

  return res.status(200).json({ success: true });
}
