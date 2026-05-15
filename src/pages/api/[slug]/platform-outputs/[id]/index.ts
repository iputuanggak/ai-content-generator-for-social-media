import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { platformOutput, generation } from "@/lib/db/schema";
import { withSlugSession } from "@/lib/with-session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PATCH") {
    return handlePatch(req, res);
  }
  return res.status(405).json({ error: "Method not allowed" });
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing id" });
  }

  const { editedContent } = req.body as { editedContent?: string };
  if (typeof editedContent !== "string") {
    return res.status(400).json({ error: "editedContent is required" });
  }

  const outputRows = await db
    .select()
    .from(platformOutput)
    .where(eq(platformOutput.id, id))
    .limit(1);

  const output = outputRows[0];
  if (!output) {
    return res.status(404).json({ error: "Not found" });
  }

  const genRows = await db
    .select()
    .from(generation)
    .where(eq(generation.id, output.generationId))
    .limit(1);

  const gen = genRows[0];
  if (!gen || gen.organizationId !== ctx.orgId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db
    .update(platformOutput)
    .set({ editedContent, updatedAt: new Date() })
    .where(eq(platformOutput.id, id));

  return res.status(200).json({ id, editedContent });
}
