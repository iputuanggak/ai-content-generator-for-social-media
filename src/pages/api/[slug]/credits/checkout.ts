import type { NextApiRequest, NextApiResponse } from "next";
import { withSlugSession } from "@/lib/with-session";
import { createCheckoutSession } from "@/lib/stripe-service";
import { getPackage } from "@/lib/packages";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const { packageSlug } = req.body as { packageSlug?: string };

  if (!packageSlug || !getPackage(packageSlug)) {
    return res.status(400).json({ error: "Invalid package" });
  }

  try {
    const url = await createCheckoutSession(
      ctx.orgId,
      packageSlug,
      ctx.memberId,
      ctx.slug
    );

    return res.status(200).json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return res.status(500).json({ error: message });
  }
}
