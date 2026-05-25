import { randomUUID } from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { creditBatch, creditTransaction } from "@/lib/db/schema";

export interface CreditServiceDeps {
  dbClient?: typeof db;
}

export async function getAvailableCredits(
  organizationId: string,
  deps: CreditServiceDeps = {}
): Promise<number> {
  const dbClient = deps.dbClient ?? db;
  const now = new Date();

  const rows = await dbClient
    .select()
    .from(creditBatch)
    .where(
      and(
        eq(creditBatch.organizationId, organizationId),
        gt(creditBatch.expiresAt, now)
      )
    );

  return rows.reduce((total, row) => total + (row.remaining ?? 0), 0);
}

export async function checkSufficientCredits(
  organizationId: string,
  requiredCount: number,
  deps: CreditServiceDeps = {}
): Promise<{ sufficient: boolean; available: number; required: number }> {
  const available = await getAvailableCredits(organizationId, deps);
  return {
    sufficient: available >= requiredCount,
    available,
    required: requiredCount,
  };
}

export async function grantStarterCredits(
  organizationId: string,
  deps: CreditServiceDeps = {}
): Promise<void> {
  const dbClient = deps.dbClient ?? db;
  const now = new Date();
  const batchId = randomUUID();

  const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(now.getTime() + twelveMonthsMs);

  await dbClient.insert(creditBatch).values({
    id: batchId,
    organizationId,
    initialAmount: 25,
    remaining: 25,
    type: "starter",
    stripeSessionId: null,
    expiresAt,
    createdAt: now,
  });

  await dbClient.insert(creditTransaction).values({
    id: randomUUID(),
    organizationId,
    amount: 25,
    type: "starter_grant",
    referenceId: null,
    memberId: null,
    batchId,
    createdAt: now,
  });
}
