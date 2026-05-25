import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { eq, and, ilike, gte, lte, desc } from "drizzle-orm";
import { generation, brandSettings } from "@/lib/db/schema";
import { withSlugSession } from "@/lib/with-session";
import type { Tone } from "@/lib/content-adapter";
import { TONE_OPTIONS } from "@/lib/content-adapter";
import { generateContent } from "@/lib/generation-service";
import { initSSE, sendSSEEvent, closeSSE } from "@/lib/sse";
import { MAX_TOPIC_LENGTH, validateLength } from "@/lib/input-validation";
import { checkSufficientCredits, deductCredits } from "@/lib/credit-service";

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    return handlePost(req, res);
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const { search, from, to, page: pageStr } = req.query as Record<string, string | undefined>;

  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const filters = [eq(generation.organizationId, ctx.orgId)];

  if (search && search.trim()) {
    filters.push(ilike(generation.topic, `%${search.trim()}%`));
  }

  if (from) {
    const fromDate = new Date(from);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({ error: "Invalid from date" });
    }
    filters.push(gte(generation.createdAt, fromDate));
  }

  if (to) {
    const toDate = new Date(to);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({ error: "Invalid to date" });
    }
    filters.push(lte(generation.createdAt, toDate));
  }

  const whereClause = filters.length > 1 ? and(...filters) : filters[0];

  const allRows = await db
    .select()
    .from(generation)
    .where(whereClause)
    .orderBy(desc(generation.createdAt));

  const total = allRows.length;
  const items = allRows.slice(offset, offset + pageSize);

  return res.status(200).json({ items, total, page, pageSize });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const { topic, tone } = req.body as { topic?: string; tone?: Tone };

  if (!topic || typeof topic !== "string" || topic.trim() === "") {
    return res.status(400).json({ error: "topic is required" });
  }
  const topicErr = validateLength("topic", topic, MAX_TOPIC_LENGTH);
  if (topicErr) return res.status(400).json({ error: topicErr });
  if (!tone || !TONE_OPTIONS.some((t) => t.value === tone)) {
    return res.status(400).json({ error: "tone must be a valid value" });
  }

  const settingsRows = await db
    .select()
    .from(brandSettings)
    .where(eq(brandSettings.organizationId, ctx.orgId))
    .limit(1);

  if (settingsRows.length === 0) {
    return res.status(500).json({ error: "Brand settings not found" });
  }

  const activePlatforms = settingsRows[0].activePlatforms as string[];
  const platformCount = activePlatforms.length;

  const creditCheck = await checkSufficientCredits(ctx.orgId, platformCount);
  if (!creditCheck.sufficient) {
    return res.status(402).json({
      error: "Insufficient credits",
      required: platformCount,
      available: creditCheck.available,
    });
  }

  let capturedGenerationId: string | null = null;
  const successfulOutputCount = { value: 0 };

  initSSE(res);

  try {
    await generateContent({
      organizationId: ctx.orgId,
      memberId: ctx.memberId,
      topic: topic.trim(),
      tone,
      onPlatformOutput: async ({ platform, content, platformOutputId, generationId }) => {
        capturedGenerationId = generationId;
        successfulOutputCount.value++;
        sendSSEEvent(res, { platform, content, generationId, platformOutputId });
      },
    });
  } catch (err) {
    console.error("Generation error:", err);
    sendSSEEvent(res, { error: "Generation failed for one or more platforms" });
  }

  if (successfulOutputCount.value > 0 && capturedGenerationId) {
    try {
      await deductCredits(ctx.orgId, successfulOutputCount.value, "generation", capturedGenerationId, ctx.memberId);
    } catch (err) {
      console.error("Credit deduction failed for generation", capturedGenerationId, err);
    }
  }

  closeSSE(res);
}
