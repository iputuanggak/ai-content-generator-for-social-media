import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { eq, and, ilike, gte, lte, desc } from "drizzle-orm";
import { member, generation } from "@/lib/db/schema";
import type { Tone } from "@/lib/content-adapter";
import { withSlugSession } from "@/lib/with-session";
import { generateContent } from "@/lib/generation-service";

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return handleGet(req, res);
  }
  if (req.method === "POST") {
    return handlePost(req, res);
  }
  return res.status(405).json({ error: "Method not allowed" });
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const { topic, tone } = req.body as { topic?: string; tone?: Tone };

  if (!topic || typeof topic !== "string" || topic.trim() === "") {
    return res.status(400).json({ error: "topic is required" });
  }
  if (!tone) {
    return res.status(400).json({ error: "tone is required" });
  }

  const memberRows = await db
    .select()
    .from(member)
    .where(eq(member.organizationId, ctx.orgId))
    .limit(100);

  const currentMember = memberRows.find((m) => m.userId === ctx.session.user.id);
  if (!currentMember) {
    return res.status(403).json({ error: "User is not a member of the active organization" });
  }

  // Set up Server-Sent Events
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    await generateContent({
      organizationId: ctx.orgId,
      memberId: currentMember.id,
      topic: topic.trim(),
      tone,
      onPlatformOutput: ({ platform, content, platformOutputId, generationId }) => {
        const event = JSON.stringify({ platform, content, generationId, platformOutputId });
        res.write(`data: ${event}\n\n`);
      },
    });
  } catch (err) {
    console.error("Generation error:", err);
    res.write(
      `data: ${JSON.stringify({ error: "Generation failed for one or more platforms" })}\n\n`
    );
  }

  res.write("data: [DONE]\n\n");
  res.end();
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
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
