import { describe, it, expect } from "vitest";
import { fetchPlatformOutputForOrg } from "@/lib/platform-output-ownership";

// Builds a fake dbClient that returns provided rows in sequence per .select() call.
// First select() call returns outputRows, second returns genRows.
function makeFakeDb({
  outputRows = [] as object[],
  genRows = [] as object[],
}) {
  let callCount = 0;
  return {
    select: () => ({
      from: (_table: unknown) => ({
        where: (_condition: unknown) => ({
          limit: (_n: number) => {
            const rows = callCount === 0 ? outputRows : genRows;
            callCount++;
            return Promise.resolve(rows);
          },
        }),
      }),
    }),
  } as unknown as Parameters<typeof fetchPlatformOutputForOrg>[2];
}

describe("fetchPlatformOutputForOrg", () => {
  it("returns not-found when no platform output row exists", async () => {
    const fakeDb = makeFakeDb({ outputRows: [], genRows: [] });
    const result = await fetchPlatformOutputForOrg("po-1", "org-1", fakeDb);
    expect(result.status).toBe("not-found");
  });

  it("returns ok when platform output belongs to the org", async () => {
    const outputRows = [{ id: "po-1", generationId: "gen-1" }];
    const genRows = [{ id: "gen-1", organizationId: "org-1" }];
    const fakeDb = makeFakeDb({ outputRows, genRows });
    const result = await fetchPlatformOutputForOrg("po-1", "org-1", fakeDb);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.output.id).toBe("po-1");
      expect(result.gen.organizationId).toBe("org-1");
    }
  });

  it("returns forbidden when generation belongs to a different org", async () => {
    const outputRows = [{ id: "po-1", generationId: "gen-1" }];
    const genRows = [{ id: "gen-1", organizationId: "other-org" }];
    const fakeDb = makeFakeDb({ outputRows, genRows });
    const result = await fetchPlatformOutputForOrg("po-1", "org-1", fakeDb);
    expect(result.status).toBe("forbidden");
  });

  it("returns forbidden when generation row is missing", async () => {
    const outputRows = [{ id: "po-1", generationId: "gen-1" }];
    const fakeDb = makeFakeDb({ outputRows, genRows: [] });
    const result = await fetchPlatformOutputForOrg("po-1", "org-1", fakeDb);
    expect(result.status).toBe("forbidden");
  });
});
