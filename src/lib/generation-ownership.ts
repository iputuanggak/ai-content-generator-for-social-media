import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { generation } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";

type GenerationRow = InferSelectModel<typeof generation>;

export type GenerationOwnershipResult =
  | { status: "ok"; gen: GenerationRow }
  | { status: "not-found" }
  | { status: "forbidden" };

export async function fetchGenerationForOrg(
  id: string,
  activeOrgId: string,
  dbClient: typeof db = db
): Promise<GenerationOwnershipResult> {
  const rows = await dbClient
    .select()
    .from(generation)
    .where(eq(generation.id, id))
    .limit(1);

  if (rows.length === 0) return { status: "not-found" };

  const gen = rows[0];

  if (gen.organizationId !== activeOrgId) return { status: "forbidden" };

  return { status: "ok", gen };
}
