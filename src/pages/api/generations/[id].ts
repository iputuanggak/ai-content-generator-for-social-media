import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generation } from "@/lib/db/schema";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth gate
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  const session = await auth.api.getSession({ headers });
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const activeOrgId = session.session.activeOrganizationId;
  if (!activeOrgId) {
    return res.status(400).json({ error: "No active organization" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing id" });
  }

  const { intendedPublishAt } = req.body as { intendedPublishAt?: unknown };

  let publishDate: Date | null = null;
  if (intendedPublishAt !== null && intendedPublishAt !== undefined) {
    const parsed = new Date(intendedPublishAt as string);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ error: "Invalid intendedPublishAt" });
    }
    publishDate = parsed;
  }

  // Find and authorize the generation
  const genRows = await db
    .select()
    .from(generation)
    .where(eq(generation.id, id))
    .limit(1);

  if (genRows.length === 0) {
    return res.status(404).json({ error: "Not found" });
  }

  if (genRows[0].organizationId !== activeOrgId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Persist the update
  await db
    .update(generation)
    .set({ intendedPublishAt: publishDate })
    .where(eq(generation.id, id));

  return res.status(200).json({ id, intendedPublishAt: publishDate?.toISOString() ?? null });
}
