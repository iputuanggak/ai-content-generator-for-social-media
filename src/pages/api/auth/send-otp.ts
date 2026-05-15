import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { createOtp, type OtpPurpose } from "@/lib/otp-service";
import { OtpEmail } from "@/emails/otp-email";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, purpose } = req.body as { email?: string; purpose?: string };

  if (!email || !purpose) {
    return res.status(400).json({ error: "email and purpose are required" });
  }

  const validPurposes: OtpPurpose[] = ["email_verification", "password_reset"];
  if (!validPurposes.includes(purpose as OtpPurpose)) {
    return res.status(400).json({ error: "Invalid purpose" });
  }

  const result = await createOtp(email, purpose as OtpPurpose);

  if ("error" in result) {
    return res.status(429).json({
      error: "cooldown",
      cooldownRemainingSeconds: result.cooldownRemainingSeconds,
    });
  }

  const purposeLabel =
    purpose === "email_verification" ? "verify your email address" : "reset your password";

  const { error: sendError } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "ContentGen <noreply@contentgen.app>",
    to: email,
    subject: `Your ContentGen verification code: ${result.code}`,
    react: OtpEmail({ code: result.code, purpose: purposeLabel }),
  });

  if (sendError) {
    return res.status(502).json({ error: "Failed to send email. Please try again." });
  }

  return res.status(200).json({ success: true });
}
