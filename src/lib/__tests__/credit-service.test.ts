import { describe, it, expect } from "vitest";
import {
  getAvailableCredits,
  checkSufficientCredits,
  grantStarterCredits,
  type CreditServiceDeps,
} from "../credit-service";

function makeDbClient(scenarios: { batchRows?: object[] }) {
  const insertedRows: { table: string; values: Record<string, unknown> }[] = [];

  const mockDbClient = {
    select: () => ({
      from: (_table: unknown) => ({
        where: (_condition: unknown) => Promise.resolve(scenarios.batchRows ?? []),
      }),
    }),
    insert: (_table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        insertedRows.push({ table: String(_table), values });
        return Promise.resolve();
      },
    }),
    _insertedRows: insertedRows,
  };

  return mockDbClient as unknown as NonNullable<CreditServiceDeps["dbClient"]> & {
    _insertedRows: typeof insertedRows;
  };
}

describe("Credit Service – getAvailableCredits", () => {
  it("sums remaining from all non-expired batches", async () => {
    const dbClient = makeDbClient({
      batchRows: [
        { id: "b1", remaining: 10 },
        { id: "b2", remaining: 5 },
      ],
    });

    const result = await getAvailableCredits("org-1", { dbClient });

    expect(result).toBe(15);
  });

  it("returns 0 when no batches exist", async () => {
    const dbClient = makeDbClient({ batchRows: [] });

    const result = await getAvailableCredits("org-1", { dbClient });

    expect(result).toBe(0);
  });
});

describe("Credit Service – checkSufficientCredits", () => {
  it("returns sufficient=true when credits are enough", async () => {
    const dbClient = makeDbClient({ batchRows: [{ remaining: 25 }] });

    const result = await checkSufficientCredits("org-1", 10, { dbClient });

    expect(result).toEqual({ sufficient: true, available: 25, required: 10 });
  });

  it("returns sufficient=false when credits are not enough", async () => {
    const dbClient = makeDbClient({ batchRows: [{ remaining: 5 }] });

    const result = await checkSufficientCredits("org-1", 10, { dbClient });

    expect(result).toEqual({ sufficient: false, available: 5, required: 10 });
  });
});

describe("Credit Service – grantStarterCredits", () => {
  it("creates a credit_batch and credit_transaction", async () => {
    const dbClient = makeDbClient({});

    await grantStarterCredits("org-1", { dbClient });

    expect(dbClient._insertedRows).toHaveLength(2);

    const batchInsert = dbClient._insertedRows[0];
    expect(batchInsert.values).toMatchObject({
      organizationId: "org-1",
      initialAmount: 25,
      remaining: 25,
      type: "starter",
      stripeSessionId: null,
    });

    const txnInsert = dbClient._insertedRows[1];
    expect(txnInsert.values).toMatchObject({
      organizationId: "org-1",
      amount: 25,
      type: "starter_grant",
      memberId: null,
      batchId: batchInsert.values.id,
    });
  });

  it("sets expires_at to approximately 12 months from now", async () => {
    const dbClient = makeDbClient({});
    const before = new Date();

    await grantStarterCredits("org-1", { dbClient });

    const after = new Date();
    const batchInsert = dbClient._insertedRows[0];
    const expiresAt = batchInsert.values.expiresAt as Date;

    const twelveMonths = 365 * 24 * 60 * 60 * 1000;
    const minExpected = new Date(before.getTime() + twelveMonths);
    const maxExpected = new Date(after.getTime() + twelveMonths);

    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(minExpected.getTime());
    expect(expiresAt.getTime()).toBeLessThanOrEqual(maxExpected.getTime());
  });
});
