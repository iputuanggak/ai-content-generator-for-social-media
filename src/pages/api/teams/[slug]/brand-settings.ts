import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { brandSettings } from "@/lib/db/schema";
import type { Tone, Platform } from "@/lib/content-adapter";
import { withSlugSession } from "@/lib/with-session";

const VALID_TONES: Tone[] = ["professional", "casual", "humorous", "inspirational"];
const VALID_PLATFORMS: Platform[] = [
  "twitter",
  "linkedin",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "threads",
  "pinterest",
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return handleGet(req, res);
  if (req.method === "PUT") return handlePut(req, res);
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const rows = await db
    .select()
    .from(brandSettings)
    .where(eq(brandSettings.organizationId, ctx.orgId))
    .limit(1);

  if (rows.length === 0) return res.status(404).json({ error: "Brand settings not found" });

  const isAdmin = ctx.role === "owner" || ctx.role === "admin";

  return res.status(200).json({ ...rows[0], role: ctx.role, isAdmin });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return res.status(403).json({ error: "Only team admins can edit brand settings" });
  }

  const { brandVoice, defaultTone, activePlatforms, modelId } = req.body as {
    brandVoice?: string;
    defaultTone?: string;
    activePlatforms?: string[];
    modelId?: string;
  };

  if (defaultTone !== undefined && !VALID_TONES.includes(defaultTone as Tone)) {
    return res.status(400).json({ error: "Invalid tone" });
  }

  if (activePlatforms !== undefined) {
    for (const p of activePlatforms) {
      if (!VALID_PLATFORMS.includes(p as Platform)) {
        return res.status(400).json({ error: `Invalid platform: ${p}` });
      }
    }
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (brandVoice !== undefined) updates.brandVoice = brandVoice;
  if (defaultTone !== undefined) updates.defaultTone = defaultTone as Tone;
  if (activePlatforms !== undefined) updates.activePlatforms = activePlatforms as Platform[];
  if (modelId !== undefined) updates.modelId = modelId;

  await db
    .update(brandSettings)
    .set(updates)
    .where(eq(brandSettings.organizationId, ctx.orgId));

  const rows = await db
    .select()
    .from(brandSettings)
    .where(eq(brandSettings.organizationId, ctx.orgId))
    .limit(1);

  return res.status(200).json(rows[0]);
}
