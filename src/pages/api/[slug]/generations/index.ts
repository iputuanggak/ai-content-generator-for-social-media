import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/db";
import { eq, and, ilike, gte, lte, desc } from "drizzle-orm";
import { generation } from "@/lib/db/schema";
import { withSlugSession } from "@/lib/with-session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const { search, from, to, page: pageStr } = req.query as Record<string, string | undefined>;

  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const filters = [eq(generation.organizationId, ctx.orgId)];

  if (search && search.trim()) {
    filters.push(ilike(generation.topic, `%${search.trim()}%`));
  }

  if (from) {
    const fromDate = new Date(from);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({ error: "Invalid from date" });
    }
    filters.push(gte(generation.createdAt, fromDate));
  }

  if (to) {
    const toDate = new Date(to);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({ error: "Invalid to date" });
    }
    filters.push(lte(generation.createdAt, toDate));
  }

  const whereClause = filters.length > 1 ? and(...filters) : filters[0];

  const allRows = await db
    .select()
    .from(generation)
    .where(whereClause)
    .orderBy(desc(generation.createdAt));

  const total = allRows.length;
  const items = allRows.slice(offset, offset + pageSize);

  return res.status(200).json({ items, total, page, pageSize });
}
