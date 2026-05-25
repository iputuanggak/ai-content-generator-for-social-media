import { randomUUID } from "crypto";
import { eq, and, gt, asc, desc, lte, sql } from "drizzle-orm";
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
    balanceBefore: 0,
    balanceAfter: 25,
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

  const balanceBefore = totalAvailable;

  let remaining = amount;

  for (const batch of batches) {
    if (remaining <= 0) break;

    const deduction = Math.min(batch.remaining!, remaining);

    await dbClient
      .update(creditBatch)
      .set({ remaining: batch.remaining! - deduction })
      .where(eq(creditBatch.id, batch.id));

    remaining -= deduction;
  }

  await dbClient.insert(creditTransaction).values({
    id: randomUUID(),
    organizationId,
    amount: -amount,
    type,
    referenceId,
    memberId,
    balanceBefore,
    balanceAfter: balanceBefore - amount,
    createdAt: now,
  });
}

export async function getTransactionHistory(
  organizationId: string,
  page: number,
  pageSize: number,
  deps: CreditServiceDeps = {}
): Promise<{ items: { id: string; amount: number; type: string; referenceId: string | null; balanceBefore: number | null; balanceAfter: number | null; createdAt: Date }[]; total: number; page: number; pageSize: number }> {
  const dbClient = deps.dbClient ?? db;

  const countResult = await dbClient
    .select({ count: sql<number>`count(*)::int` })
    .from(creditTransaction)
    .where(eq(creditTransaction.organizationId, organizationId));

  const total = countResult[0]?.count ?? 0;

  const rows = await dbClient
    .select({
      id: creditTransaction.id,
      amount: creditTransaction.amount,
      type: creditTransaction.type,
      referenceId: creditTransaction.referenceId,
      balanceBefore: creditTransaction.balanceBefore,
      balanceAfter: creditTransaction.balanceAfter,
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
      balanceBefore: r.balanceBefore,
      balanceAfter: r.balanceAfter,
      createdAt: r.createdAt,
    })),
    total,
    page,
    pageSize,
  };
}

export async function addTopUpCredits(
  organizationId: string,
  amount: number,
  stripeSessionId: string,
  memberId: string,
  deps: CreditServiceDeps = {}
): Promise<void> {
  const dbClient = deps.dbClient ?? db;
  const now = new Date();
  const batchId = randomUUID();

  const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(now.getTime() + twelveMonthsMs);

  const currentBalance = await getAvailableCredits(organizationId, deps);

  await dbClient.insert(creditBatch).values({
    id: batchId,
    organizationId,
    initialAmount: amount,
    remaining: amount,
    type: "top_up",
    stripeSessionId,
    expiresAt,
    createdAt: now,
  });

  await dbClient.insert(creditTransaction).values({
    id: randomUUID(),
    organizationId,
    amount,
    type: "top_up",
    referenceId: stripeSessionId,
    memberId,
    balanceBefore: currentBalance,
    balanceAfter: currentBalance + amount,
    createdAt: now,
  });
}

export function computeRunningBalance(
  rows: { id: string; amount: number }[]
): { id: string; balanceBefore: number; balanceAfter: number }[] {
  let running = 0;
  return rows.map((row) => {
    const balanceBefore = running;
    const balanceAfter = running + row.amount;
    running = balanceAfter;
    return { id: row.id, balanceBefore, balanceAfter };
  });
}

export async function backfillRunningBalances(
  deps: CreditServiceDeps = {}
): Promise<void> {
  const dbClient = deps.dbClient ?? db;

  const orgs = await dbClient
    .select({ id: creditTransaction.organizationId })
    .from(creditTransaction)
    .groupBy(creditTransaction.organizationId);

  for (const org of orgs) {
    const rows = await dbClient
      .select({
        id: creditTransaction.id,
        amount: creditTransaction.amount,
      })
      .from(creditTransaction)
      .where(eq(creditTransaction.organizationId, org.id))
      .orderBy(asc(creditTransaction.createdAt));

    const updates = computeRunningBalance(rows);

    for (const u of updates) {
      await dbClient
        .update(creditTransaction)
        .set({ balanceBefore: u.balanceBefore, balanceAfter: u.balanceAfter })
        .where(eq(creditTransaction.id, u.id));
    }
  }
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
