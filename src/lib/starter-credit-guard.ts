import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { member } from "@/lib/db/schema";
import type { CreditServiceDeps } from "./credit-service";

export type StarterCreditGuardDeps = CreditServiceDeps;

export async function shouldGrantStarterCredits(
  userId: string,
  deps: StarterCreditGuardDeps = {}
): Promise<boolean> {
  const dbClient = deps.dbClient ?? db;

  const result = await dbClient
    .select({ count: sql<number>`count(*)::int` })
    .from(member)
    .where(eq(member.userId, userId));

  return (result[0]?.count ?? 0) === 1;
}
