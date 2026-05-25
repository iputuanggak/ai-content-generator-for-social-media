import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { platformOutput, brandSettings } from "@/lib/db/schema";
import { buildPrompts, type Platform, type Tone } from "@/lib/content-adapter";
import { callOpenRouter } from "@/lib/openrouter-client";
import { withSlugSession } from "@/lib/with-session";
import { fetchPlatformOutputForOrg } from "@/lib/platform-output-ownership";
import { checkSufficientCredits, deductCredits } from "@/lib/credit-service";

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

  const ownership = await fetchPlatformOutputForOrg(id, ctx.orgId);
  if (ownership.status === "not-found") {
    return res.status(404).json({ error: "Not found" });
  }
  if (ownership.status === "forbidden") {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { output, gen } = ownership;

  const creditCheck = await checkSufficientCredits(ctx.orgId, 1);
  if (!creditCheck.sufficient) {
    return res.status(402).json({
      error: "Insufficient credits",
      required: 1,
      available: creditCheck.available,
    });
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

  try {
    await deductCredits(ctx.orgId, 1, "regeneration", id, ctx.memberId);
  } catch (err) {
    console.error("Credit deduction failed for regeneration", id, err);
  }

  return res.status(200).json({ id, content: newContent });
}
