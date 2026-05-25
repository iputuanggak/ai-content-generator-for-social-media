import { randomUUID } from "crypto";
import { eq, and, gt, asc, desc, lte } from "drizzle-orm";
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

export async function deductCredits(
  organizationId: string,
  amount: number,
  type: "generation" | "regeneration",
  referenceId: string,
  memberId: string,
  deps: CreditServiceDeps = {}
): Promise<void> {
  const dbClient = deps.dbClient ?? db;
  const now = new Date();

  const batches = await dbClient
    .select()
    .from(creditBatch)
    .where(
      and(
        eq(creditBatch.organizationId, organizationId),
        gt(creditBatch.remaining, 0),
        gt(creditBatch.expiresAt, now)
      )
    )
    .orderBy(asc(creditBatch.createdAt));

  const totalAvailable = batches.reduce((sum, b) => sum + (b.remaining ?? 0), 0);
  if (totalAvailable < amount) {
    throw new Error(`Insufficient credits: need ${amount}, have ${totalAvailable}`);
  }

  let remaining = amount;

  for (const batch of batches) {
    if (remaining <= 0) break;

    const deduction = Math.min(batch.remaining!, remaining);

    await dbClient
      .update(creditBatch)
      .set({ remaining: batch.remaining! - deduction })
      .where(eq(creditBatch.id, batch.id));

    await dbClient.insert(creditTransaction).values({
      id: randomUUID(),
      organizationId,
      amount: -deduction,
      type,
      referenceId,
      memberId,
      batchId: batch.id,
      createdAt: now,
    });

    remaining -= deduction;
  }
}

export async function getTransactionHistory(
  organizationId: string,
  page: number,
  pageSize: number,
  deps: CreditServiceDeps = {}
): Promise<{ items: { id: string; amount: number; type: string; referenceId: string | null; batchId: string | null; createdAt: Date }[]; total: number; page: number; pageSize: number }> {
  const dbClient = deps.dbClient ?? db;

  const rows = await dbClient
    .select({
      id: creditTransaction.id,
      amount: creditTransaction.amount,
      type: creditTransaction.type,
      referenceId: creditTransaction.referenceId,
      batchId: creditTransaction.batchId,
      createdAt: creditTransaction.createdAt,
    })
    .from(creditTransaction)
    .where(eq(creditTransaction.organizationId, organizationId))
    .orderBy(desc(creditTransaction.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    items: rows.map((r) => ({
      id: r.id,
      amount: r.amount,
      type: r.type,
      referenceId: r.referenceId,
      batchId: r.batchId,
      createdAt: r.createdAt,
    })),
    total: rows.length,
    page,
    pageSize,
  };
}

export async function getExpiringBatches(
  organizationId: string,
  withinDays: number,
  deps: CreditServiceDeps = {}
): Promise<{ id: string; remaining: number; expiresAt: Date; createdAt: Date; initialAmount: number }[]> {
  const dbClient = deps.dbClient ?? db;
  const now = new Date();
  const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

  const rows = await dbClient
    .select({
      id: creditBatch.id,
      remaining: creditBatch.remaining,
      expiresAt: creditBatch.expiresAt,
      createdAt: creditBatch.createdAt,
      initialAmount: creditBatch.initialAmount,
    })
    .from(creditBatch)
    .where(
      and(
        eq(creditBatch.organizationId, organizationId),
        gt(creditBatch.remaining, 0),
        gt(creditBatch.expiresAt, now),
        lte(creditBatch.expiresAt, cutoff)
      )
    );

  return rows.map((r) => ({
    id: r.id,
    remaining: r.remaining,
    expiresAt: r.expiresAt,
    createdAt: r.createdAt,
    initialAmount: r.initialAmount,
  }));
}
