import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";
import { buildPrompts, type Platform, type Tone } from "@/lib/content-adapter";
import { callOpenRouter } from "@/lib/openrouter-client";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { member, brandSettings, generation, platformOutput } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export const config = {
  api: {
    responseLimit: false,
  },
};

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

  const { topic, tone } = req.body as { topic?: string; tone?: Tone };

  if (!topic || typeof topic !== "string" || topic.trim() === "") {
    return res.status(400).json({ error: "topic is required" });
  }
  if (!tone) {
    return res.status(400).json({ error: "tone is required" });
  }

  // Find member record
  const memberRows = await db
    .select()
    .from(member)
    .where(eq(member.organizationId, activeOrgId))
    .limit(100);

  const currentMember = memberRows.find((m) => m.userId === session.user.id);
  if (!currentMember) {
    return res.status(403).json({ error: "User is not a member of the active organization" });
  }

  // Read Brand Settings
  const settingsRows = await db
    .select()
    .from(brandSettings)
    .where(eq(brandSettings.organizationId, activeOrgId))
    .limit(1);

  if (settingsRows.length === 0) {
    return res.status(500).json({ error: "Brand settings not configured" });
  }

  const settings = settingsRows[0];
  const activePlatforms = settings.activePlatforms as Platform[];
  const modelId = settings.modelId;
  const brandVoice = settings.brandVoice;

  // Set up Server-Sent Events
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const generationId = randomUUID();
  const now = new Date();

  // Insert generation record first
  await db.insert(generation).values({
    id: generationId,
    organizationId: activeOrgId,
    memberId: currentMember.id,
    topic: topic.trim(),
    tone,
    intendedPublishAt: null,
    createdAt: now,
  });

  // Generate concurrently, send each output as it completes
  const platformPromises = activePlatforms.map(async (platform) => {
    const { systemPrompt, userPrompt } = buildPrompts(topic.trim(), tone, brandVoice, platform);
    const content = await callOpenRouter({ modelId, systemPrompt, userPrompt });

    // Persist platform output
    await db.insert(platformOutput).values({
      id: randomUUID(),
      generationId,
      platform,
      content,
      editedContent: null,
      updatedAt: new Date(),
    });

    // Stream to client
    const event = JSON.stringify({ platform, content, generationId });
    res.write(`data: ${event}\n\n`);

    return { platform, content };
  });

  try {
    await Promise.all(platformPromises);
  } catch (err) {
    console.error("Generation error:", err);
    res.write(`data: ${JSON.stringify({ error: "Generation failed for one or more platforms" })}\n\n`);
  }

  res.write("data: [DONE]\n\n");
  res.end();
}
