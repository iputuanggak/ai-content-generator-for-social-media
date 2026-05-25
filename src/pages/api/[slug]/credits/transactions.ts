import type { NextApiRequest, NextApiResponse } from "next";
import { withSlugSession } from "@/lib/with-session";
import { getTransactionHistory } from "@/lib/credit-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ctx = await withSlugSession(req, res);
  if (!ctx) return;

  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const pageSize = 20;

  const result = await getTransactionHistory(ctx.orgId, page, pageSize);

  return res.status(200).json({
    items: result.items.map((item) => ({
      id: item.id,
      amount: item.amount,
      type: item.type,
      referenceId: item.referenceId,
      batchId: item.batchId,
      createdAt: item.createdAt,
    })),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  });
}
