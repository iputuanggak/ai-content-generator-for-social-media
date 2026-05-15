import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generation, platformOutput } from "@/lib/db/schema";
import { withSlugSession } from "@/lib/with-session";

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
  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing id" });
  }

  const genRows = await db
    .select()
    .from(generation)
    .where(eq(generation.id, id))
    .limit(1);

  const gen = genRows[0];
  if (!gen) {
    return res.status(404).json({ error: "Not found" });
  }

  if (gen.organizationId !== ctx.orgId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const outputs = await db
    .select()
    .from(platformOutput)
    .where(eq(platformOutput.generationId, gen.id));

  return res.status(200).json({
    generation: {
      id: gen.id,
      topic: gen.topic,
      tone: gen.tone,
      intendedPublishAt: gen.intendedPublishAt ?? null,
      createdAt: gen.createdAt,
    },
    platformOutputs: outputs.map((o) => ({
      id: o.id,
      platform: o.platform,
      content: o.content,
      editedContent: o.editedContent,
    })),
  });
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing id" });
  }

  const { intendedPublishAt } = req.body as { intendedPublishAt?: string | null };

  let publishDate: Date | null = null;
  if (intendedPublishAt !== null && intendedPublishAt !== undefined) {
    const parsed = new Date(intendedPublishAt);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ error: "Invalid intendedPublishAt" });
    }
    publishDate = parsed;
  }

  const genRows = await db
    .select()
    .from(generation)
    .where(eq(generation.id, id))
    .limit(1);

  const gen = genRows[0];
  if (!gen) {
    return res.status(404).json({ error: "Not found" });
  }

  if (gen.organizationId !== ctx.orgId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db
    .update(generation)
    .set({ intendedPublishAt: publishDate })
    .where(eq(generation.id, id));

  return res.status(200).json({
    id,
    intendedPublishAt: publishDate?.toISOString() ?? null,
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing id" });
  }

  const genRows = await db
    .select()
    .from(generation)
    .where(eq(generation.id, id))
    .limit(1);

  const gen = genRows[0];
  if (!gen) {
    return res.status(404).json({ error: "Not found" });
  }

  if (gen.organizationId !== ctx.orgId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db.delete(generation).where(eq(generation.id, id));

  return res.status(200).json({ id });
}
