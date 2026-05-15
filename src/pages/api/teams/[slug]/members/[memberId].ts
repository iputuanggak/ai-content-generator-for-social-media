import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { member } from "@/lib/db/schema";
import { withSlugSession } from "@/lib/with-session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "DELETE") return handleDelete(req, res);
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const memberId = req.query.memberId as string;

  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return res.status(403).json({ error: "Only team admins can remove members" });
  }

  const targetMemberRows = await db
    .select()
    .from(member)
    .where(eq(member.id, memberId))
    .limit(1);

  if (targetMemberRows.length === 0 || targetMemberRows[0].organizationId !== ctx.orgId) {
    return res.status(404).json({ error: "Member not found" });
  }

  const targetMember = targetMemberRows[0];

  if (targetMember.role === "owner") {
    return res.status(403).json({ error: "Cannot remove an owner" });
  }

  await db.delete(member).where(eq(member.id, memberId));

  return res.status(200).json({ success: true });
}
