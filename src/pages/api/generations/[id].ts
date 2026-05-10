import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generation, platformOutput } from "@/lib/db/schema";
import { withSession } from "@/lib/with-session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return handleGet(req, res);
  }
  if (req.method === "PATCH") {
    return handlePatch(req, res);
  }
  if (req.method === "DELETE") {
    return handleDelete(req, res);
  }
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withSession(req, res);
  if (!ctx) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Missing id" });

  const genRows = await db.select().from(generation).where(eq(generation.id, id)).limit(1);
  if (genRows.length === 0) return res.status(404).json({ error: "Not found" });
  if (genRows[0].organizationId !== ctx.activeOrgId)
    return res.status(403).json({ error: "Forbidden" });

  const outputs = await db
    .select()
    .from(platformOutput)
    .where(eq(platformOutput.generationId, id));

  return res.status(200).json({ generation: genRows[0], platformOutputs: outputs });
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withSession(req, res);
  if (!ctx) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Missing id" });

  const { intendedPublishAt } = req.body as { intendedPublishAt?: unknown };

  let publishDate: Date | null = null;
  if (intendedPublishAt !== null && intendedPublishAt !== undefined) {
    const parsed = new Date(intendedPublishAt as string);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ error: "Invalid intendedPublishAt" });
    }
    publishDate = parsed;
  }

  const genRows = await db.select().from(generation).where(eq(generation.id, id)).limit(1);
  if (genRows.length === 0) return res.status(404).json({ error: "Not found" });
  if (genRows[0].organizationId !== ctx.activeOrgId)
    return res.status(403).json({ error: "Forbidden" });

  await db.update(generation).set({ intendedPublishAt: publishDate }).where(eq(generation.id, id));

  return res.status(200).json({ id, intendedPublishAt: publishDate?.toISOString() ?? null });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withSession(req, res);
  if (!ctx) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Missing id" });

  const genRows = await db.select().from(generation).where(eq(generation.id, id)).limit(1);
  if (genRows.length === 0) return res.status(404).json({ error: "Not found" });
  if (genRows[0].organizationId !== ctx.activeOrgId)
    return res.status(403).json({ error: "Forbidden" });

  await db.delete(platformOutput).where(eq(platformOutput.generationId, id));
  await db.delete(generation).where(eq(generation.id, id));

  return res.status(200).json({ id });
}
