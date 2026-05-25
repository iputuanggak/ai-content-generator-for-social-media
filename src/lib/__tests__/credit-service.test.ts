import { describe, it, expect } from "vitest";
import {
  getAvailableCredits,
  checkSufficientCredits,
  grantStarterCredits,
  deductCredits,
  addTopUpCredits,
  getTransactionHistory,
  getExpiringBatches,
  type CreditServiceDeps,
} from "../credit-service";

function makeDbClient(scenarios: { batchRows?: object[] }) {
  const insertedRows: { table: string; values: Record<string, unknown> }[] = [];
  const updatedRows: { table: string; values: Record<string, unknown>; where: unknown }[] = [];

  const batchRows = scenarios.batchRows ?? [];

  const makeWhereResult = () => {
    const promise = Promise.resolve(batchRows) as Promise<object[]> & {
      orderBy: (...args: unknown[]) => Promise<object[]>;
    };
    promise.orderBy = (..._args: unknown[]) => Promise.resolve(batchRows);
    return promise;
  };

  const mockDbClient = {
    select: () => ({
      from: (_table: unknown) => ({
        where: (_condition: unknown) => makeWhereResult(),
      }),
    }),
    insert: (_table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        insertedRows.push({ table: String(_table), values });
        return Promise.resolve();
      },
    }),
    update: (_table: unknown) => ({
      set: (values: Record<string, unknown>) => ({
        where: (condition: unknown) => {
          updatedRows.push({ table: String(_table), values, where: condition });
          return Promise.resolve();
        },
      }),
    }),
    _insertedRows: insertedRows,
    _updatedRows: updatedRows,
  };

  return mockDbClient as unknown as NonNullable<CreditServiceDeps["dbClient"]> & {
    _insertedRows: typeof insertedRows;
    _updatedRows: typeof updatedRows;
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

  it("writes balanceBefore=0 and balanceAfter=25 on the transaction", async () => {
    const dbClient = makeDbClient({});

    await grantStarterCredits("org-1", { dbClient });

    const txnInsert = dbClient._insertedRows[1];
    expect(txnInsert.values).toMatchObject({
      balanceBefore: 0,
      balanceAfter: 25,
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

describe("Credit Service – deductCredits", () => {
  it("deducts from a single batch with enough remaining", async () => {
    const dbClient = makeDbClient({
      batchRows: [{ id: "b1", remaining: 10 }],
    });

    await deductCredits("org-1", 3, "generation", "po-1", "member-1", { dbClient });

    expect(dbClient._updatedRows).toHaveLength(1);
    expect(dbClient._updatedRows[0].values).toMatchObject({ remaining: 7 });

    expect(dbClient._insertedRows).toHaveLength(1);
    const txn = dbClient._insertedRows[0];
    expect(txn.values).toMatchObject({
      organizationId: "org-1",
      amount: -3,
      type: "generation",
      referenceId: "po-1",
      memberId: "member-1",
      batchId: "b1",
    });
  });

  it("spans multiple batches when single batch is insufficient", async () => {
    const dbClient = makeDbClient({
      batchRows: [
        { id: "b1", remaining: 2 },
        { id: "b2", remaining: 5 },
      ],
    });

    await deductCredits("org-1", 4, "generation", "po-1", "member-1", { dbClient });

    expect(dbClient._updatedRows).toHaveLength(2);
    expect(dbClient._updatedRows[0].values).toMatchObject({ remaining: 0 });
    expect(dbClient._updatedRows[1].values).toMatchObject({ remaining: 3 });

    expect(dbClient._insertedRows).toHaveLength(2);
    expect(dbClient._insertedRows[0].values).toMatchObject({
      amount: -2,
      batchId: "b1",
    });
    expect(dbClient._insertedRows[1].values).toMatchObject({
      amount: -2,
      batchId: "b2",
    });
  });

  it("throws when total available is less than requested", async () => {
    const dbClient = makeDbClient({
      batchRows: [{ id: "b1", remaining: 2 }],
    });

    await expect(
      deductCredits("org-1", 5, "generation", "po-1", "member-1", { dbClient })
    ).rejects.toThrow("Insufficient credits");

    expect(dbClient._updatedRows).toHaveLength(0);
    expect(dbClient._insertedRows).toHaveLength(0);
  });

  it("throws when no batches exist", async () => {
    const dbClient = makeDbClient({ batchRows: [] });

    await expect(
      deductCredits("org-1", 1, "generation", "po-1", "member-1", { dbClient })
    ).rejects.toThrow("Insufficient credits");
  });

  it("deducts exactly 1 credit for regeneration", async () => {
    const dbClient = makeDbClient({
      batchRows: [{ id: "b1", remaining: 10 }],
    });

    await deductCredits("org-1", 1, "regeneration", "po-2", "member-1", { dbClient });

    expect(dbClient._updatedRows).toHaveLength(1);
    expect(dbClient._updatedRows[0].values).toMatchObject({ remaining: 9 });

    expect(dbClient._insertedRows).toHaveLength(1);
    expect(dbClient._insertedRows[0].values).toMatchObject({
      amount: -1,
      type: "regeneration",
      referenceId: "po-2",
    });
  });

  it("deducts from oldest batches first (FIFO)", async () => {
    const dbClient = makeDbClient({
      batchRows: [
        { id: "old", remaining: 1 },
        { id: "mid", remaining: 3 },
        { id: "new", remaining: 10 },
      ],
    });

    await deductCredits("org-1", 5, "generation", "po-1", "member-1", { dbClient });

    expect(dbClient._updatedRows).toHaveLength(3);
    expect(dbClient._updatedRows[0].values.remaining).toBe(0);
    expect(dbClient._updatedRows[1].values.remaining).toBe(0);
    expect(dbClient._updatedRows[2].values.remaining).toBe(9);
  });
});

function makeTransactionDbClient(transactionRows: object[], totalCount: number) {
  let selectCallCount = 0;

  const mockDbClient = {
    select: () => {
      selectCallCount++;
      if (selectCallCount === 1) {
        return {
          from: (_table: unknown) => ({
            where: (_condition: unknown) => Promise.resolve([{ count: totalCount }]),
          }),
        };
      }
      return {
        from: (_table: unknown) => ({
          where: (_condition: unknown) => ({
            orderBy: (..._args: unknown[]) => ({
              limit: (_n: unknown) => ({
                offset: (_n: unknown) => Promise.resolve(transactionRows),
              }),
            }),
          }),
        }),
      };
    },
    _totalCount: totalCount,
  };

  return mockDbClient as unknown as NonNullable<CreditServiceDeps["dbClient"]> & {
    _totalCount: number;
  };
}

function makeExpiringBatchesDbClient(batchRows: object[]) {
  const mockDbClient = {
    select: () => ({
      from: (_table: unknown) => ({
        where: (_condition: unknown) => Promise.resolve(batchRows),
      }),
    }),
  };

  return mockDbClient as unknown as NonNullable<CreditServiceDeps["dbClient"]>;
}

describe("Credit Service – getTransactionHistory", () => {
  it("returns paginated transaction results with correct shape", async () => {
    const rows = [
      { id: "t1", amount: -1, type: "generation", referenceId: "po-1", batchId: "b1", balanceBefore: 25, balanceAfter: 24, createdAt: new Date("2025-01-02") },
      { id: "t2", amount: 25, type: "starter_grant", referenceId: null, batchId: "b2", balanceBefore: 0, balanceAfter: 25, createdAt: new Date("2025-01-01") },
    ];

    const dbClient = makeTransactionDbClient(rows, 2);

    const result = await getTransactionHistory("org-1", 1, 20, { dbClient });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      id: "t1",
      amount: -1,
      type: "generation",
      referenceId: "po-1",
      batchId: "b1",
      balanceBefore: 25,
      balanceAfter: 24,
    });
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("returns empty items when no transactions exist", async () => {
    const dbClient = makeTransactionDbClient([], 0);

    const result = await getTransactionHistory("org-1", 1, 20, { dbClient });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("returns correct total from count query, not page length", async () => {
    const rows = [
      { id: "t1", amount: 25, type: "starter_grant", referenceId: null, batchId: "b1", balanceBefore: 0, balanceAfter: 25, createdAt: new Date("2025-01-01") },
    ];

    const dbClient = makeTransactionDbClient(rows, 42);

    const result = await getTransactionHistory("org-1", 1, 20, { dbClient });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(42);
  });

  it("includes balanceBefore and balanceAfter per item", async () => {
    const rows = [
      { id: "t1", amount: 100, type: "top_up", referenceId: "cs_1", batchId: "b1", balanceBefore: 25, balanceAfter: 125, createdAt: new Date("2025-01-03") },
    ];

    const dbClient = makeTransactionDbClient(rows, 1);

    const result = await getTransactionHistory("org-1", 1, 20, { dbClient });

    expect(result.items[0]).toMatchObject({
      balanceBefore: 25,
      balanceAfter: 125,
    });
  });

  it("returns null balance fields when not set", async () => {
    const rows = [
      { id: "t1", amount: -1, type: "generation", referenceId: "po-1", batchId: "b1", balanceBefore: null, balanceAfter: null, createdAt: new Date("2025-01-01") },
    ];

    const dbClient = makeTransactionDbClient(rows, 1);

    const result = await getTransactionHistory("org-1", 1, 20, { dbClient });

    expect(result.items[0]).toMatchObject({
      balanceBefore: null,
      balanceAfter: null,
    });
  });
});

describe("Credit Service – addTopUpCredits", () => {
  it("creates a credit_batch and credit_transaction for top-up", async () => {
    const dbClient = makeDbClient({});

    await addTopUpCredits("org-1", 100, "cs_test_123", "member-1", { dbClient });

    expect(dbClient._insertedRows).toHaveLength(2);

    const batchInsert = dbClient._insertedRows[0];
    expect(batchInsert.values).toMatchObject({
      organizationId: "org-1",
      initialAmount: 100,
      remaining: 100,
      type: "top_up",
      stripeSessionId: "cs_test_123",
    });

    const txnInsert = dbClient._insertedRows[1];
    expect(txnInsert.values).toMatchObject({
      organizationId: "org-1",
      amount: 100,
      type: "top_up",
      referenceId: "cs_test_123",
      memberId: "member-1",
      batchId: batchInsert.values.id,
    });
  });

  it("writes balanceBefore=current balance and balanceAfter=current balance + top-up amount", async () => {
    const dbClient = makeDbClient({
      batchRows: [{ id: "b1", remaining: 25 }],
    });

    await addTopUpCredits("org-1", 100, "cs_test_123", "member-1", { dbClient });

    const txnInsert = dbClient._insertedRows[1];
    expect(txnInsert.values).toMatchObject({
      balanceBefore: 25,
      balanceAfter: 125,
    });
  });

  it("writes balanceBefore=0 when team has no existing credits", async () => {
    const dbClient = makeDbClient({ batchRows: [] });

    await addTopUpCredits("org-1", 100, "cs_test_123", "member-1", { dbClient });

    const txnInsert = dbClient._insertedRows[1];
    expect(txnInsert.values).toMatchObject({
      balanceBefore: 0,
      balanceAfter: 100,
    });
  });

  it("sets expires_at to approximately 12 months from now", async () => {
    const dbClient = makeDbClient({});
    const before = new Date();

    await addTopUpCredits("org-1", 500, "cs_test_456", "member-1", { dbClient });

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

describe("Credit Service – getExpiringBatches", () => {
  it("returns batches expiring within specified days", async () => {
    const rows = [
      { id: "b1", remaining: 10, expiresAt: new Date("2025-02-01"), createdAt: new Date("2025-01-01") },
      { id: "b2", remaining: 5, expiresAt: new Date("2025-01-20"), createdAt: new Date("2025-01-01") },
    ];

    const dbClient = makeExpiringBatchesDbClient(rows);

    const result = await getExpiringBatches("org-1", 30, { dbClient });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: "b1", remaining: 10 });
    expect(result[1]).toMatchObject({ id: "b2", remaining: 5 });
  });

  it("returns empty array when no batches are expiring", async () => {
    const dbClient = makeExpiringBatchesDbClient([]);

    const result = await getExpiringBatches("org-1", 30, { dbClient });

    expect(result).toHaveLength(0);
  });
});
