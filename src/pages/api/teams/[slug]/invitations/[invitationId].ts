import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { invitation } from "@/lib/db/schema";
import { withAdminSlugSession } from "@/lib/with-session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "DELETE") return handleDelete(req, res);
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withAdminSlugSession(req, res);
  if (!ctx) return;

  const invitationId = req.query.invitationId as string;

  const rows = await db
    .select()
    .from(invitation)
    .where(eq(invitation.id, invitationId))
    .limit(1);

  if (rows.length === 0 || rows[0].organizationId !== ctx.orgId) {
    return res.status(404).json({ error: "Invitation not found" });
  }

  await auth.api.cancelInvitation({
    headers: ctx.headers,
    body: { invitationId },
  });

  return res.status(200).json({ success: true });
}
