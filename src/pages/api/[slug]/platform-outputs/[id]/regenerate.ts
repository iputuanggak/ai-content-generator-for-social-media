import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { platformOutput, generation, brandSettings } from "@/lib/db/schema";
import { buildPrompts, type Platform, type Tone } from "@/lib/content-adapter";
import { callOpenRouter } from "@/lib/openrouter-client";
import { withSlugSession } from "@/lib/with-session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    return handleRegenerate(req, res);
  }
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleRegenerate(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing id" });
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

  const settingsRows = await db
    .select()
    .from(brandSettings)
    .where(eq(brandSettings.organizationId, gen.organizationId))
    .limit(1);

  const settings = settingsRows[0];
  if (!settings) {
    return res.status(500).json({ error: "Brand settings not found" });
  }

  const { systemPrompt, userPrompt } = buildPrompts(
    gen.topic,
    gen.tone as Tone,
    settings.brandVoice,
    output.platform as Platform
  );

  const newContent = await callOpenRouter({
    modelId: settings.modelId,
    systemPrompt,
    userPrompt,
  });

  await db
    .update(platformOutput)
    .set({ content: newContent, editedContent: null, updatedAt: new Date() })
    .where(eq(platformOutput.id, id));

  return res.status(200).json({ id, content: newContent });
}
