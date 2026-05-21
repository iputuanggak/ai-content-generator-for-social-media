import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generation, platformOutput } from "@/lib/db/schema";
import { withSlugSession } from "@/lib/with-session";
import { fetchGenerationForOrg } from "@/lib/generation-ownership";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return handleGet(req, res);
  if (req.method === "PATCH") return handlePatch(req, res);
  if (req.method === "DELETE") return handleDelete(req, res);
  return res.status(405).json({ error: "Method not allowed" });
}

function resolveOwnership(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "Missing id" });
    return { id: null } as const;
  }
  return { id } as const;
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const { id } = resolveOwnership(req, res);
  if (!id) return;

  const ownership = await fetchGenerationForOrg(id, ctx.orgId);
  if (ownership.status === "not-found") return res.status(404).json({ error: "Not found" });
  if (ownership.status === "forbidden") return res.status(403).json({ error: "Forbidden" });

  const outputs = await db
    .select()
    .from(platformOutput)
    .where(eq(platformOutput.generationId, ownership.gen.id));

  return res.status(200).json({
    generation: {
      id: ownership.gen.id,
      topic: ownership.gen.topic,
      tone: ownership.gen.tone,
      intendedPublishAt: ownership.gen.intendedPublishAt ?? null,
      createdAt: ownership.gen.createdAt,
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

  const { id } = resolveOwnership(req, res);
  if (!id) return;

  const { intendedPublishAt } = req.body as { intendedPublishAt?: string | null };

  let publishDate: Date | null = null;
  if (intendedPublishAt !== null && intendedPublishAt !== undefined) {
    const parsed = new Date(intendedPublishAt);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ error: "Invalid intendedPublishAt" });
    }
    publishDate = parsed;
  }

  const ownership = await fetchGenerationForOrg(id, ctx.orgId);
  if (ownership.status === "not-found") return res.status(404).json({ error: "Not found" });
  if (ownership.status === "forbidden") return res.status(403).json({ error: "Forbidden" });

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

  const { id } = resolveOwnership(req, res);
  if (!id) return;

  const ownership = await fetchGenerationForOrg(id, ctx.orgId);
  if (ownership.status === "not-found") return res.status(404).json({ error: "Not found" });
  if (ownership.status === "forbidden") return res.status(403).json({ error: "Forbidden" });

  await db.delete(generation).where(eq(generation.id, id));

  return res.status(200).json({ id });
}
