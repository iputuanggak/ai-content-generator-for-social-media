import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { organization, member } from "@/lib/db/schema";

export interface ResolvedOrg {
  id: string;
  name: string;
  slug: string | null;
  role: string;
}

export type ResolveResult =
  | { status: 200; body: ResolvedOrg }
  | { status: 401; body: { error: string } }
  | { status: 404; body: { error: string } };

export async function resolveSlugToOrg(
  slug: string,
  headers: Headers
): Promise<ResolveResult> {
  const session = await auth.api.getSession({ headers });
  if (!session) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  const orgRows = await db
    .select({ id: organization.id, name: organization.name, slug: organization.slug })
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1);

  if (orgRows.length === 0) {
    return { status: 404, body: { error: "Team not found" } };
  }

  const org = orgRows[0];

  const memberRows = await db
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, org.id), eq(member.userId, session.user.id)))
    .limit(1);

  if (memberRows.length === 0) {
    return { status: 404, body: { error: "Team not found" } };
  }

  return {
    status: 200,
    body: { id: org.id, name: org.name, slug: org.slug, role: memberRows[0].role },
  };
}
