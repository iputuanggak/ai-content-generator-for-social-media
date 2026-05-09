import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { platformOutput, generation } from "@/lib/db/schema";

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

  const { editedContent } = req.body as { editedContent?: unknown };
  if (typeof editedContent !== "string") {
    return res.status(400).json({ error: "editedContent is required" });
  }

  // Find the platform output
  const outputRows = await db
    .select()
    .from(platformOutput)
    .where(eq(platformOutput.id, id))
    .limit(1);

  if (outputRows.length === 0) {
    return res.status(404).json({ error: "Not found" });
  }

  const output = outputRows[0];

  // Verify ownership via generation's organizationId
  const genRows = await db
    .select()
    .from(generation)
    .where(eq(generation.id, output.generationId))
    .limit(1);

  if (genRows.length === 0 || genRows[0].organizationId !== activeOrgId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Persist the edit
  await db
    .update(platformOutput)
    .set({ editedContent, updatedAt: new Date() })
    .where(eq(platformOutput.id, id));

  return res.status(200).json({ id, editedContent });
}
