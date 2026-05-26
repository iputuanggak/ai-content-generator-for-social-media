import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { member, user } from "@/lib/db/schema";
import { buildReqHeaders, withSlugSession, withAdminSlugSession, isAdminRole } from "@/lib/with-session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return handleGet(req, res);
  if (req.method === "POST") return handlePost(req, res);
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const rows = await db
    .select({
      id: member.id,
      organizationId: member.organizationId,
      userId: member.userId,
      role: member.role,
      createdAt: member.createdAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, ctx.orgId));

  let invitations: unknown[] = [];
  try {
    const allInvitations = await auth.api.listInvitations({
      headers: ctx.headers,
      query: { organizationId: ctx.orgId },
    });
    if (Array.isArray(allInvitations)) {
      invitations = allInvitations
        .filter((inv: Record<string, unknown>) => inv.status === "pending")
        .map((inv: Record<string, unknown>) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          status: inv.status,
          expiresAt: inv.expiresAt,
          createdAt: inv.createdAt,
        }));
    }
  } catch {
    // invitations are optional — do not block members list
  }

  return res.status(200).json({ members: rows, invitations, isAdmin: isAdminRole(ctx.role) });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withAdminSlugSession(req, res);
  if (!ctx) return;

  const { email } = req.body as { email?: string };
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  try {
    const result = await auth.api.createInvitation({
      headers: buildReqHeaders(req),
      body: {
        email,
        role: "member",
        organizationId: ctx.orgId,
      },
    });

    return res.status(201).json({ invitation: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create invitation";
    return res.status(400).json({ error: message });
  }
}
