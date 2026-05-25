import type { NextApiRequest, NextApiResponse } from "next";
import { withSlugSession } from "@/lib/with-session";
import { db } from "@/lib/db";
import { eq, and, gt, lte } from "drizzle-orm";
import { creditBatch } from "@/lib/db/schema";
import { getAvailableCredits } from "@/lib/credit-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const available = await getAvailableCredits(ctx.orgId);

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringBatches = await db
    .select({
      id: creditBatch.id,
      remaining: creditBatch.remaining,
      expiresAt: creditBatch.expiresAt,
    })
    .from(creditBatch)
    .where(
      and(
        eq(creditBatch.organizationId, ctx.orgId),
        gt(creditBatch.remaining, 0),
        gt(creditBatch.expiresAt, now),
        lte(creditBatch.expiresAt, thirtyDaysFromNow)
      )
    );

  return res.status(200).json({
    available,
    expiringSoon: expiringBatches.map((b) => ({
      id: b.id,
      remaining: b.remaining,
      expiresAt: b.expiresAt,
    })),
  });
}
