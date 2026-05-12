import { describe, it, expect } from "vitest";

interface MockSession {
  user: { id: string; name: string };
  session: { activeOrganizationId: string | null };
}

interface MockOrg {
  id: string;
  name: string;
}

async function handleGetSessionExtended({
  session,
  getFullOrganization,
  listOrganizations,
}: {
  session: MockSession | null;
  getFullOrganization: (opts: { organizationId: string }) => Promise<MockOrg | null>;
  listOrganizations: () => Promise<MockOrg[]>;
}): Promise<{ status: number; body: unknown }> {
  if (!session) return { status: 200, body: { session: null } };

  let teamName: string | null = null;
  let activeOrgId = session.session.activeOrganizationId;

  if (activeOrgId) {
    const org = await getFullOrganization({ organizationId: activeOrgId });
    if (org?.name) teamName = org.name;
  }

  if (!teamName) {
    const orgs = await listOrganizations();
    if (orgs?.length) {
      teamName = orgs[0].name;
      activeOrgId = orgs[0].id;
    }
  }

  const allOrgs = await listOrganizations();
  const teams = (allOrgs ?? []).map((o) => ({ id: o.id, name: o.name }));

  return {
    status: 200,
    body: {
      session,
      userName: session.user.name,
      teamName,
      teamId: activeOrgId ?? null,
      teams,
    },
  };
}

describe("handleGetSessionExtended", () => {
  it("returns null session when not authenticated", async () => {
    const result = await handleGetSessionExtended({
      session: null,
      getFullOrganization: async () => null,
      listOrganizations: async () => [],
    });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ session: null });
  });

  it("returns extended data with active org", async () => {
    const result = await handleGetSessionExtended({
      session: {
        user: { id: "u1", name: "Alice" },
        session: { activeOrganizationId: "org-1" },
      },
      getFullOrganization: async () => ({ id: "org-1", name: "Team Alpha" }),
      listOrganizations: async () => [
        { id: "org-1", name: "Team Alpha" },
        { id: "org-2", name: "Team Beta" },
      ],
    });

    expect(result.status).toBe(200);
    const body = result.body as Record<string, unknown>;
    expect(body.userName).toBe("Alice");
    expect(body.teamName).toBe("Team Alpha");
    expect(body.teamId).toBe("org-1");
    expect(body.teams).toEqual([
      { id: "org-1", name: "Team Alpha" },
      { id: "org-2", name: "Team Beta" },
    ]);
  });

  it("falls back to first org when no active org", async () => {
    const result = await handleGetSessionExtended({
      session: {
        user: { id: "u1", name: "Bob" },
        session: { activeOrganizationId: null },
      },
      getFullOrganization: async () => null,
      listOrganizations: async () => [{ id: "org-1", name: "Team Alpha" }],
    });

    expect(result.status).toBe(200);
    const body = result.body as Record<string, unknown>;
    expect(body.userName).toBe("Bob");
    expect(body.teamName).toBe("Team Alpha");
    expect(body.teamId).toBe("org-1");
    expect(body.teams).toEqual([{ id: "org-1", name: "Team Alpha" }]);
  });

  it("returns null teamName/teamId when user has no orgs", async () => {
    const result = await handleGetSessionExtended({
      session: {
        user: { id: "u1", name: "Charlie" },
        session: { activeOrganizationId: null },
      },
      getFullOrganization: async () => null,
      listOrganizations: async () => [],
    });

    expect(result.status).toBe(200);
    const body = result.body as Record<string, unknown>;
    expect(body.userName).toBe("Charlie");
    expect(body.teamName).toBeNull();
    expect(body.teamId).toBeNull();
    expect(body.teams).toEqual([]);
  });
});
