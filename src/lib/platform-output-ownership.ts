import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { platformOutput, generation } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type PlatformOutputRow = InferSelectModel<typeof platformOutput>;
type GenerationRow = InferSelectModel<typeof generation>;

export type PlatformOutputOwnershipResult =
  | { status: "ok"; output: PlatformOutputRow; gen: GenerationRow }
  | { status: "not-found" }
  | { status: "forbidden" };

/**
 * Fetches a platform output by ID and verifies it belongs to the given org via
 * the two-hop join (PlatformOutput → Generation → organizationId).
 *
 * Returns a discriminated union so callers can produce the correct HTTP status.
 */
export async function fetchPlatformOutputForOrg(
  id: string,
  activeOrgId: string,
  dbClient: typeof db = db
): Promise<PlatformOutputOwnershipResult> {
  const outputRows = await dbClient
    .select()
    .from(platformOutput)
    .where(eq(platformOutput.id, id))
    .limit(1);

  if (outputRows.length === 0) return { status: "not-found" };

  const output = outputRows[0];

  const genRows = await dbClient
    .select()
    .from(generation)
    .where(eq(generation.id, output.generationId))
    .limit(1);

  if (genRows.length === 0 || genRows[0].organizationId !== activeOrgId) {
    return { status: "forbidden" };
  }

  return { status: "ok", output, gen: genRows[0] };
}
