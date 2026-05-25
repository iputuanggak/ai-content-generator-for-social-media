import type { NextApiRequest, NextApiResponse } from "next";
import type { Platform } from "@/lib/content-adapter";
import { withSlugSession } from "@/lib/with-session";
import { fetchPlatformOutputForOrg } from "@/lib/platform-output-ownership";
import { regeneratePlatformOutput } from "@/lib/generation-service";
import { withCreditGuard } from "@/lib/credit-guard";

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

  const guardResult = await withCreditGuard<string>({
    organizationId: ctx.orgId,
    memberId: ctx.memberId,
    creditCost: 1,
    creditType: "regeneration",
    async execute() {
      const newContent = await regeneratePlatformOutput({
        organizationId: ctx.orgId,
        platformOutputId: id,
        topic: gen.topic,
        tone: gen.tone,
        platform: output.platform as Platform,
      });
      return { referenceId: id, data: newContent };
    },
  });

  if (guardResult.status === "insufficient") {
    return res.status(402).json({
      error: "Insufficient credits",
      required: 1,
      available: guardResult.available,
    });
  }

  return res.status(200).json({ id, content: guardResult.data });
}
