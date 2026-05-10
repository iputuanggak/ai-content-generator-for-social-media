import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";

export type SessionContext = {
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
  activeOrgId: string;
  headers: Headers;
};

/**
 * Builds a WHATWG Headers object from a Next.js API request.
 * Exported so routes that don't need the full auth gate can reuse it.
 */
export function buildReqHeaders(req: NextApiRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }
  return headers;
}

/**
 * Full auth gate for API routes that require both a session and an active org.
 * Writes 401 or 400 and returns null when the gate fails.
 */
export async function withSession(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<SessionContext | null> {
  const headers = buildReqHeaders(req);
  const session = await auth.api.getSession({ headers });

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const activeOrgId = session.session.activeOrganizationId;
  if (!activeOrgId) {
    res.status(400).json({ error: "No active organization" });
    return null;
  }

  return { session, activeOrgId, headers };
}
