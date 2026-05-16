import { auth } from "@/lib/auth";

interface OrgLike {
  id: string;
  slug: string | null;
}

export function getSmartRedirectLogic(orgs: OrgLike[]): string {
  if (orgs.length === 0) return "/onboarding";
  if (orgs.length === 1) return `/${orgs[0].slug ?? orgs[0].id}`;
  return "/teams";
}

export async function getSmartRedirect(headers: Headers): Promise<string> {
  const orgs = await auth.api.listOrganizations({ headers });
  return getSmartRedirectLogic(orgs ?? []);
}
