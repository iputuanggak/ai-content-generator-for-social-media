import { describe, it, expect, vi } from "vitest";
import type { CreditServiceDeps } from "../credit-service";
import {
  withCreditGuard,
  type CreditGuardResponse,
} from "../credit-guard";

function makeDbClient(scenarios: {
  batchRows?: { id: string; remaining: number }[];
}) {
  const batchRows = scenarios.batchRows ?? [];
  const insertedRows: { table: string; values: Record<string, unknown> }[] = [];
  const updatedRows: { table: string; values: Record<string, unknown>; where: unknown }[] = [];

  const makeWhereResult = () => {
    const promise = Promise.resolve(batchRows) as Promise<object[]> & {
      orderBy: (...rest: unknown[]) => Promise<object[]>;
    };
    promise.orderBy = () => Promise.resolve(batchRows);
    return promise;
  };

  const mockDbClient = {
    select: () => ({
      from: () => ({
        where: () => makeWhereResult(),
      }),
    }),
    insert: () => ({
      values: (values: Record<string, unknown>) => {
        insertedRows.push({ table: "mock", values });
        return Promise.resolve();
      },
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => ({
        where: (condition: unknown) => {
          updatedRows.push({ table: "mock", values, where: condition });
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

describe("withCreditGuard", () => {
  it("returns 'ok' when credits are sufficient and deducts after execution", async () => {
    const dbClient = makeDbClient({ batchRows: [{ id: "b1", remaining: 25 }] });

    const result: CreditGuardResponse<string> = await withCreditGuard({
      organizationId: "org-1",
      memberId: "member-1",
      creditCost: 2,
      creditType: "generation",
      execute: async () => ({ referenceId: "gen-1", data: "result-data" }),
      deps: { dbClient },
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.data).toBe("result-data");
      expect(result.creditCheck).toEqual({ available: 25, required: 2 });
      expect(result.deduction).toEqual({ amount: 2, referenceId: "gen-1" });
    }
  });

  it("returns 'insufficient' when credits are not enough", async () => {
    const dbClient = makeDbClient({ batchRows: [{ id: "b1", remaining: 2 }] });

    const result: CreditGuardResponse<string> = await withCreditGuard({
      organizationId: "org-1",
      memberId: "member-1",
      creditCost: 5,
      creditType: "generation",
      execute: async () => ({ referenceId: "gen-1", data: "should not run" }),
      deps: { dbClient },
    });

    expect(result.status).toBe("insufficient");
    if (result.status === "insufficient") {
      expect(result.available).toBe(2);
      expect(result.required).toBe(5);
    }
  });

  it("calls execute when credits are sufficient", async () => {
    const dbClient = makeDbClient({ batchRows: [{ id: "b1", remaining: 10 }] });
    const executeFn = vi.fn().mockResolvedValue({
      referenceId: "gen-1",
      data: "done",
    });

    await withCreditGuard({
      organizationId: "org-1",
      memberId: "member-1",
      creditCost: 1,
      creditType: "regeneration",
      execute: executeFn,
      deps: { dbClient },
    });

    expect(executeFn).toHaveBeenCalledOnce();
  });

  it("does not call execute when credits are insufficient", async () => {
    const dbClient = makeDbClient({ batchRows: [{ id: "b1", remaining: 2 }] });
    const executeFn = vi.fn().mockResolvedValue({
      referenceId: "gen-1",
      data: "done",
    });

    await withCreditGuard({
      organizationId: "org-1",
      memberId: "member-1",
      creditCost: 5,
      creditType: "generation",
      execute: executeFn,
      deps: { dbClient },
    });

    expect(executeFn).not.toHaveBeenCalled();
  });

  it("swallows deduction failure and still returns ok", async () => {
    const batchRows = [{ id: "b1", remaining: 10 }];

    const makeWhereResult = () => {
      const promise = Promise.resolve(batchRows) as Promise<object[]> & {
        orderBy: (...rest: unknown[]) => Promise<object[]>;
      };
      promise.orderBy = () => Promise.resolve(batchRows);
      return promise;
    };

    const dbClient = {
      select: () => ({
        from: () => ({
          where: () => makeWhereResult(),
        }),
      }),
      insert: () => ({
        values: () => Promise.reject(new Error("DB write failed")),
      }),
      update: () => ({
        set: () => ({
          where: () => Promise.resolve(),
        }),
      }),
    } as unknown as NonNullable<CreditServiceDeps["dbClient"]>;

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result: CreditGuardResponse<string> = await withCreditGuard({
      organizationId: "org-1",
      memberId: "member-1",
      creditCost: 1,
      creditType: "generation",
      execute: async () => ({ referenceId: "gen-1", data: "content" }),
      deps: { dbClient },
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.data).toBe("content");
    }
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Credit deduction failed"),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it("uses regeneration type correctly", async () => {
    const dbClient = makeDbClient({ batchRows: [{ id: "b1", remaining: 10 }] });

    const result: CreditGuardResponse<string> = await withCreditGuard({
      organizationId: "org-1",
      memberId: "member-1",
      creditCost: 1,
      creditType: "regeneration",
      execute: async () => ({ referenceId: "po-1", data: "new content" }),
      deps: { dbClient },
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.deduction).toEqual({ amount: 1, referenceId: "po-1" });
    }
  });
});
