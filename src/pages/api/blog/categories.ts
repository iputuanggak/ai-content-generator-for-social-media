import type { NextApiRequest, NextApiResponse } from "next";
import { getCategories, GetCategoriesResponse } from "@/lib/strapi-client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetCategoriesResponse | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await getCategories();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching categories:", err);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
}
