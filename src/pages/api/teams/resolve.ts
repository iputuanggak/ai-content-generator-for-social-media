import type { NextApiRequest, NextApiResponse } from "next";
import { resolveSlugToOrg } from "@/lib/resolve-slug";
import { buildReqHeaders } from "@/lib/with-session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const slug = req.query.slug as string;
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "Missing or invalid slug parameter" });
  }

  const result = await resolveSlugToOrg(slug, buildReqHeaders(req));
  return res.status(result.status).json(result.body);
}
