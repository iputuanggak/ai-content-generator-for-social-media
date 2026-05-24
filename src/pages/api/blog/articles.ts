import type { NextApiRequest, NextApiResponse } from "next";
import { getArticles, GetArticlesResponse } from "@/lib/strapi-client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetArticlesResponse | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 9);
  const categorySlug =
    typeof req.query.categorySlug === "string" && req.query.categorySlug
      ? req.query.categorySlug
      : undefined;

  try {
    const result = await getArticles({ page, pageSize, categorySlug });
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching articles:", err);
    return res.status(500).json({ error: "Failed to fetch articles" });
  }
}
