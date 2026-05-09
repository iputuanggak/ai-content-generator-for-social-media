import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { member, brandSettings } from "@/lib/db/schema";
import type { Tone, Platform } from "@/lib/content-adapter";

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

function getHeaders(req: NextApiRequest): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }
  return headers;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") return handleGet(req, res);
  if (req.method === "PUT") return handlePut(req, res);
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const session = await auth.api.getSession({ headers: getHeaders(req) });
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const teamId = req.query.id as string;

  // Check membership
  const memberRows = await db
    .select()
    .from(member)
    .where(and(eq(member.organizationId, teamId), eq(member.userId, session.user.id)))
    .limit(1);

  if (memberRows.length === 0) return res.status(403).json({ error: "Forbidden" });

  const rows = await db
    .select()
    .from(brandSettings)
    .where(eq(brandSettings.organizationId, teamId))
    .limit(1);

  if (rows.length === 0) return res.status(404).json({ error: "Brand settings not found" });

  return res.status(200).json(rows[0]);
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const session = await auth.api.getSession({ headers: getHeaders(req) });
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const teamId = req.query.id as string;

  // Check membership and role
  const memberRows = await db
    .select()
    .from(member)
    .where(and(eq(member.organizationId, teamId), eq(member.userId, session.user.id)))
    .limit(1);

  if (memberRows.length === 0) return res.status(403).json({ error: "Forbidden" });

  const currentMember = memberRows[0];
  if (currentMember.role !== "owner" && currentMember.role !== "admin") {
    return res.status(403).json({ error: "Only team admins can edit brand settings" });
  }

  const { brandVoice, defaultTone, activePlatforms, modelId } = req.body as {
    brandVoice?: string;
    defaultTone?: string;
    activePlatforms?: string[];
    modelId?: string;
  };

  // Validate tone
  if (defaultTone !== undefined && !VALID_TONES.includes(defaultTone as Tone)) {
    return res.status(400).json({ error: "Invalid tone" });
  }

  // Validate platforms
  if (activePlatforms !== undefined) {
    for (const p of activePlatforms) {
      if (!VALID_PLATFORMS.includes(p as Platform)) {
        return res.status(400).json({ error: `Invalid platform: ${p}` });
      }
    }
  }

  // Build update payload
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (brandVoice !== undefined) updates.brandVoice = brandVoice;
  if (defaultTone !== undefined) updates.defaultTone = defaultTone as Tone;
  if (activePlatforms !== undefined) updates.activePlatforms = activePlatforms as Platform[];
  if (modelId !== undefined) updates.modelId = modelId;

  await db
    .update(brandSettings)
    .set(updates)
    .where(eq(brandSettings.organizationId, teamId));

  // Return updated settings
  const rows = await db
    .select()
    .from(brandSettings)
    .where(eq(brandSettings.organizationId, teamId))
    .limit(1);

  return res.status(200).json(rows[0]);
}
