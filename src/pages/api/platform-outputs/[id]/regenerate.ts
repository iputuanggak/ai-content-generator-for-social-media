import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { platformOutput, generation, brandSettings } from "@/lib/db/schema";
import { buildPrompts, type Platform, type Tone } from "@/lib/content-adapter";
import { callOpenRouter } from "@/lib/openrouter-client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
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

  const gen = genRows[0];

  // Get current brand settings
  const settingsRows = await db
    .select()
    .from(brandSettings)
    .where(eq(brandSettings.organizationId, activeOrgId))
    .limit(1);

  if (settingsRows.length === 0) {
    return res.status(500).json({ error: "Brand settings not found" });
  }

  const settings = settingsRows[0];

  // Build prompt and call OpenRouter for this single platform
  const promptPair = buildPrompts(
    gen.topic,
    gen.tone as Tone,
    settings.brandVoice,
    output.platform as Platform
  );

  const newContent = await callOpenRouter({
    modelId: settings.modelId,
    systemPrompt: promptPair.systemPrompt,
    userPrompt: promptPair.userPrompt,
  });

  // Update content, clear editedContent
  await db
    .update(platformOutput)
    .set({ content: newContent, editedContent: null, updatedAt: new Date() })
    .where(eq(platformOutput.id, id));

  return res.status(200).json({ id, content: newContent });
}
