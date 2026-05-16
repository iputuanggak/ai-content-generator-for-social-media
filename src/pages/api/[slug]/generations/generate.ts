import type { NextApiRequest, NextApiResponse } from "next";
import type { Tone } from "@/lib/content-adapter";
import { withSlugSession } from "@/lib/with-session";
import { generateContent } from "@/lib/generation-service";
import { initSSE, sendSSEEvent, closeSSE } from "@/lib/sse";

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const { topic, tone } = req.body as { topic?: string; tone?: Tone };

  if (!topic || typeof topic !== "string" || topic.trim() === "") {
    return res.status(400).json({ error: "topic is required" });
  }
  if (!tone) {
    return res.status(400).json({ error: "tone is required" });
  }

  // ctx.memberId is resolved by withSlugSession — no redundant member lookup needed.
  // generateContent accepts orgId + memberId directly from context.
  initSSE(res);

  try {
    await generateContent({
      organizationId: ctx.orgId,
      memberId: ctx.memberId,
      topic: topic.trim(),
      tone,
      onPlatformOutput: ({ platform, content, platformOutputId, generationId }) => {
        sendSSEEvent(res, { platform, content, generationId, platformOutputId });
      },
    });
  } catch (err) {
    console.error("Generation error:", err);
    sendSSEEvent(res, { error: "Generation failed for one or more platforms" });
  }

  closeSSE(res);
}
