import type { NextApiRequest, NextApiResponse } from "next";
import { withSlugSession } from "@/lib/with-session";
import { getAvailableCredits, getExpiringBatches, expireStaleBatches } from "@/lib/credit-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  await expireStaleBatches(ctx.orgId);

  const [available, expiringSoon] = await Promise.all([
    getAvailableCredits(ctx.orgId),
    getExpiringBatches(ctx.orgId, 30),
  ]);

  return res.status(200).json({
    available,
    expiringSoon,
  });
}
