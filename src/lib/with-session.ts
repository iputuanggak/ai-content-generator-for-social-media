import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";
import { resolveSlugToOrg } from "@/lib/resolve-slug";

export type SessionContext = {
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
  activeOrgId: string;
  headers: Headers;
};

export type SlugSessionContext = {
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
  orgId: string;
  slug: string;
  role: string;
  memberId: string;
  headers: Headers;
};

export function buildReqHeaders(req: NextApiRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }
  return headers;
}

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

export async function withSlugSession(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<SlugSessionContext | null> {
  const headers = buildReqHeaders(req);
  const session = await auth.api.getSession({ headers });

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const slug = req.query.slug as string | undefined;

  if (!slug) {
    res.status(400).json({ error: "Missing team slug" });
    return null;
  }

  const result = await resolveSlugToOrg(slug, headers);

  if (result.status === 401) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  if (result.status === 404) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  return {
    session,
    orgId: result.body.id,
    slug: result.body.slug ?? slug,
    role: result.body.role,
    memberId: result.body.memberId,
    headers,
  };
}
