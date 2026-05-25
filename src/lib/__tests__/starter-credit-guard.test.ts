import { describe, it, expect } from "vitest";
import {
  shouldGrantStarterCredits,
  type StarterCreditGuardDeps,
} from "../starter-credit-guard";

function makeCountDbClient(membershipCount: number) {
  const mockDbClient = {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([{ count: membershipCount }]),
      }),
    }),
  };

  return mockDbClient as unknown as NonNullable<StarterCreditGuardDeps["dbClient"]>;
}

describe("shouldGrantStarterCredits", () => {
  it("returns true when user has exactly 1 membership (first Team)", async () => {
    const dbClient = makeCountDbClient(1);

    const result = await shouldGrantStarterCredits("user-1", { dbClient });

    expect(result).toBe(true);
  });

  it("returns false when user has more than 1 membership (additional Team)", async () => {
    const dbClient = makeCountDbClient(3);

    const result = await shouldGrantStarterCredits("user-1", { dbClient });

    expect(result).toBe(false);
  });

  it("returns false when user has 0 memberships", async () => {
    const dbClient = makeCountDbClient(0);

    const result = await shouldGrantStarterCredits("user-1", { dbClient });

    expect(result).toBe(false);
  });

  it("returns false when user has exactly 2 memberships", async () => {
    const dbClient = makeCountDbClient(2);

    const result = await shouldGrantStarterCredits("user-1", { dbClient });

    expect(result).toBe(false);
  });
});
