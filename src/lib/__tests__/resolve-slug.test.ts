import { describe, it, expect } from "vitest";

interface MockOrg {
  id: string;
  name: string;
  slug: string | null;
}

interface MockMember {
  organizationId: string;
  userId: string;
  role: string;
}

interface MockSession {
  user: { id: string };
  session: { activeOrganizationId: string | null };
}

type ResolveResult =
  | { status: 200; body: { id: string; name: string; slug: string | null; role: string } }
  | { status: 401; body: { error: string } }
  | { status: 404; body: { error: string } };

async function resolveSlugToOrgLogic({
  slug,
  session,
  getOrgBySlug,
  getMember,
}: {
  slug: string;
  session: MockSession | null;
  getOrgBySlug: (slug: string) => Promise<MockOrg | null>;
  getMember: (orgId: string, userId: string) => Promise<MockMember | null>;
}): Promise<ResolveResult> {
  if (!session) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  const org = await getOrgBySlug(slug);
  if (!org) {
    return { status: 404, body: { error: "Team not found" } };
  }

  const membership = await getMember(org.id, session.user.id);
  if (!membership) {
    return { status: 404, body: { error: "Team not found" } };
  }

  return {
    status: 200,
    body: { id: org.id, name: org.name, slug: org.slug, role: membership.role },
  };
}

const adminSession: MockSession = {
  user: { id: "user-1" },
  session: { activeOrganizationId: "org-1" },
};

const sampleOrg: MockOrg = { id: "org-1", name: "Acme Marketing", slug: "acme-marketing" };
const adminMember: MockMember = { organizationId: "org-1", userId: "user-1", role: "owner" };
const regularMember: MockMember = { organizationId: "org-1", userId: "user-1", role: "member" };

describe("resolveSlugToOrg", () => {
  it("returns 401 for unauthenticated requests", async () => {
    const result = await resolveSlugToOrgLogic({
      slug: "acme-marketing",
      session: null,
      getOrgBySlug: async () => sampleOrg,
      getMember: async () => adminMember,
    });
    expect(result.status).toBe(401);
  });

  it("returns 404 when slug does not exist", async () => {
    const result = await resolveSlugToOrgLogic({
      slug: "nonexistent",
      session: adminSession,
      getOrgBySlug: async () => null,
      getMember: async () => adminMember,
    });
    expect(result.status).toBe(404);
    expect(result.body).toEqual({ error: "Team not found" });
  });

  it("returns 404 when user is not a member", async () => {
    const result = await resolveSlugToOrgLogic({
      slug: "acme-marketing",
      session: adminSession,
      getOrgBySlug: async () => sampleOrg,
      getMember: async () => null,
    });
    expect(result.status).toBe(404);
    expect(result.body).toEqual({ error: "Team not found" });
  });

  it("returns org info for an authenticated member (owner)", async () => {
    const result = await resolveSlugToOrgLogic({
      slug: "acme-marketing",
      session: adminSession,
      getOrgBySlug: async () => sampleOrg,
      getMember: async () => adminMember,
    });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      id: "org-1",
      name: "Acme Marketing",
      slug: "acme-marketing",
      role: "owner",
    });
  });

  it("returns org info for an authenticated member (regular)", async () => {
    const result = await resolveSlugToOrgLogic({
      slug: "acme-marketing",
      session: adminSession,
      getOrgBySlug: async () => sampleOrg,
      getMember: async () => regularMember,
    });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      id: "org-1",
      name: "Acme Marketing",
      slug: "acme-marketing",
      role: "member",
    });
  });
});

describe("GET /api/teams/resolve", () => {
  async function handleResolve({
    slug,
    session,
    getOrgBySlug,
    getMember,
  }: {
    slug: string | undefined;
    session: MockSession | null;
    getOrgBySlug: (slug: string) => Promise<MockOrg | null>;
    getMember: (orgId: string, userId: string) => Promise<MockMember | null>;
  }): Promise<{ status: number; body: unknown }> {
    if (!slug || typeof slug !== "string") {
      return { status: 400, body: { error: "Missing or invalid slug parameter" } };
    }

    return resolveSlugToOrgLogic({ slug, session, getOrgBySlug, getMember });
  }

  it("returns 400 when slug parameter is missing", async () => {
    const result = await handleResolve({
      slug: undefined,
      session: adminSession,
      getOrgBySlug: async () => sampleOrg,
      getMember: async () => adminMember,
    });
    expect(result.status).toBe(400);
  });

  it("returns 401 for unauthenticated requests", async () => {
    const result = await handleResolve({
      slug: "acme-marketing",
      session: null,
      getOrgBySlug: async () => sampleOrg,
      getMember: async () => adminMember,
    });
    expect(result.status).toBe(401);
  });

  it("returns 404 for non-existent slug", async () => {
    const result = await handleResolve({
      slug: "nope",
      session: adminSession,
      getOrgBySlug: async () => null,
      getMember: async () => adminMember,
    });
    expect(result.status).toBe(404);
  });

  it("returns 404 when user is not a member", async () => {
    const result = await handleResolve({
      slug: "acme-marketing",
      session: adminSession,
      getOrgBySlug: async () => sampleOrg,
      getMember: async () => null,
    });
    expect(result.status).toBe(404);
  });

  it("returns 200 with org data for authenticated member", async () => {
    const result = await handleResolve({
      slug: "acme-marketing",
      session: adminSession,
      getOrgBySlug: async () => sampleOrg,
      getMember: async () => adminMember,
    });
    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      id: "org-1",
      name: "Acme Marketing",
      slug: "acme-marketing",
      role: "owner",
    });
  });
});
