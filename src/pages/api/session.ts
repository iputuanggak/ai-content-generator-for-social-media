import { auth } from "@/lib/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { buildReqHeaders } from "@/lib/with-session";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const headers = buildReqHeaders(req);
  const session = await auth.api.getSession({ headers });

  if (!session) {
    return res.status(200).json({ session: null });
  }

  let teamName: string | null = null;
  let activeOrgId = session.session.activeOrganizationId;

  if (activeOrgId) {
    const org = await auth.api.getFullOrganization({
      headers,
      query: { organizationId: activeOrgId },
    });
    if (org?.name) teamName = org.name;
  }

  if (!teamName) {
    const orgs = await auth.api.listOrganizations({ headers });
    if (orgs?.length) {
      teamName = orgs[0].name;
      activeOrgId = orgs[0].id;
      await auth.api.setActiveOrganization({ headers, body: { organizationId: orgs[0].id } });
    }
  }

  const allOrgs = await auth.api.listOrganizations({ headers });
  const teams = (allOrgs ?? []).map((o) => ({ id: o.id, name: o.name }));

  res.status(200).json({
    session,
    userName: session.user.name,
    teamName,
    teamId: activeOrgId ?? null,
    teams,
  });
}
