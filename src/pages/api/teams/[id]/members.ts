import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { member, user } from "@/lib/db/schema";
import { buildReqHeaders } from "@/lib/with-session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return handleGet(req, res);
  if (req.method === "POST") return handlePost(req, res);
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const session = await auth.api.getSession({ headers: buildReqHeaders(req) });
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const teamId = req.query.id as string;

  // Verify requester is a member
  const currentMemberRows = await db
    .select()
    .from(member)
    .where(and(eq(member.organizationId, teamId), eq(member.userId, session.user.id)))
    .limit(1);

  if (currentMemberRows.length === 0) return res.status(403).json({ error: "Forbidden" });

  // List all members with user info
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
    .where(eq(member.organizationId, teamId));

  const isAdmin = currentMemberRows[0].role === "owner" || currentMemberRows[0].role === "admin";

  return res.status(200).json({ members: rows, isAdmin });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const session = await auth.api.getSession({ headers: buildReqHeaders(req) });
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const teamId = req.query.id as string;

  // Check membership and role
  const currentMemberRows = await db
    .select()
    .from(member)
    .where(and(eq(member.organizationId, teamId), eq(member.userId, session.user.id)))
    .limit(1);

  if (currentMemberRows.length === 0) return res.status(403).json({ error: "Forbidden" });

  const currentMember = currentMemberRows[0];
  if (currentMember.role !== "owner" && currentMember.role !== "admin") {
    return res.status(403).json({ error: "Only team admins can invite members" });
  }

  const { email } = req.body as { email?: string };
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  // Use Better Auth organization plugin to create an invitation
  try {
    const result = await auth.api.createInvitation({
      headers: buildReqHeaders(req),
      body: {
        email,
        role: "member",
        organizationId: teamId,
      },
    });

    return res.status(201).json({ invitation: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create invitation";
    return res.status(400).json({ error: message });
  }
}
