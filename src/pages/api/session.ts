import { auth } from "@/lib/auth";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * GET /api/session
 * Returns the current session (or null if not authenticated).
 * Demonstrates server-side session access via Better Auth.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  const session = await auth.api.getSession({
    headers,
  });

  res.status(200).json({ session });
}
