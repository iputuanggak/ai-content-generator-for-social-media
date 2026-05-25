import type { NextApiRequest, NextApiResponse } from "next";
import { verifyAndHandleWebhook } from "@/lib/stripe-service";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const signature = req.headers["stripe-signature"] as string | undefined;
  if (!signature) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const rawBody = Buffer.concat(chunks);

  try {
    await verifyAndHandleWebhook(rawBody, signature);
    return res.status(200).json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return res.status(400).json({ error: message });
  }
}
