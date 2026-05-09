import { describe, it, expect } from "vitest";

// Pure handler logic for GET /api/generations
// Supports: search (topic keyword), from/to date filter, pagination

interface MockSession {
  user: { id: string };
  session: { activeOrganizationId: string | null };
}

interface MockGeneration {
  id: string;
  organizationId: string;
  topic: string;
  tone: string;
  intendedPublishAt: Date | null;
  createdAt: Date;
}

async function handleListGenerations({
  query,
  session,
  listGenerations,
}: {
  query: Record<string, string | string[] | undefined>;
  session: MockSession | null;
  listGenerations: (params: {
    orgId: string;
    search?: string;
    from?: Date;
    to?: Date;
    page: number;
    pageSize: number;
  }) => Promise<{ items: MockGeneration[]; total: number }>;
}): Promise<{ status: number; body: unknown }> {
  if (!session) return { status: 401, body: { error: "Unauthorized" } };
  const activeOrgId = session.session.activeOrganizationId;
  if (!activeOrgId) return { status: 400, body: { error: "No active organization" } };

  const search = typeof query.search === "string" ? query.search : undefined;

  let from: Date | undefined;
  let to: Date | undefined;

  if (typeof query.from === "string" && query.from) {
    const parsed = new Date(query.from);
    if (isNaN(parsed.getTime())) return { status: 400, body: { error: "Invalid from date" } };
    from = parsed;
  }

  if (typeof query.to === "string" && query.to) {
    const parsed = new Date(query.to);
    if (isNaN(parsed.getTime())) return { status: 400, body: { error: "Invalid to date" } };
    to = parsed;
  }

  const page = typeof query.page === "string" ? Math.max(1, parseInt(query.page, 10) || 1) : 1;
  const pageSize = 20;

  const result = await listGenerations({ orgId: activeOrgId, search, from, to, page, pageSize });

  return {
    status: 200,
    body: {
      items: result.items,
      total: result.total,
      page,
      pageSize,
    },
  };
}

const authedSession: MockSession = {
  user: { id: "user-1" },
  session: { activeOrganizationId: "org-1" },
};

const sampleGenerations: MockGeneration[] = [
  {
    id: "gen-1",
    organizationId: "org-1",
    topic: "AI trends",
    tone: "professional",
    intendedPublishAt: null,
    createdAt: new Date("2026-05-10T10:00:00Z"),
  },
  {
    id: "gen-2",
    organizationId: "org-1",
    topic: "Summer sale",
    tone: "casual",
    intendedPublishAt: new Date("2026-06-01T09:00:00Z"),
    createdAt: new Date("2026-05-09T08:00:00Z"),
  },
];

describe("GET /api/generations list logic", () => {
  it("returns 401 when unauthenticated", async () => {
    const result = await handleListGenerations({
      query: {},
      session: null,
      listGenerations: async () => ({ items: [], total: 0 }),
    });
    expect(result.status).toBe(401);
  });

  it("returns 400 when no active org", async () => {
    const result = await handleListGenerations({
      query: {},
      session: { user: { id: "u" }, session: { activeOrganizationId: null } },
      listGenerations: async () => ({ items: [], total: 0 }),
    });
    expect(result.status).toBe(400);
  });

  it("returns 200 with paginated items", async () => {
    const result = await handleListGenerations({
      query: {},
      session: authedSession,
      listGenerations: async () => ({ items: sampleGenerations, total: 2 }),
    });
    expect(result.status).toBe(200);
    const body = result.body as { items: MockGeneration[]; total: number; page: number; pageSize: number };
    expect(body.items).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(20);
  });

  it("passes search param to listGenerations", async () => {
    const calls: { orgId: string; search?: string }[] = [];
    await handleListGenerations({
      query: { search: "AI" },
      session: authedSession,
      listGenerations: async (params) => {
        calls.push(params);
        return { items: [], total: 0 };
      },
    });
    expect(calls[0].search).toBe("AI");
    expect(calls[0].orgId).toBe("org-1");
  });

  it("passes from/to date filters to listGenerations", async () => {
    const calls: { from?: Date; to?: Date }[] = [];
    await handleListGenerations({
      query: { from: "2026-01-01", to: "2026-12-31" },
      session: authedSession,
      listGenerations: async (params) => {
        calls.push(params);
        return { items: [], total: 0 };
      },
    });
    expect(calls[0].from).toBeInstanceOf(Date);
    expect(calls[0].to).toBeInstanceOf(Date);
  });

  it("returns 400 for invalid from date", async () => {
    const result = await handleListGenerations({
      query: { from: "not-a-date" },
      session: authedSession,
      listGenerations: async () => ({ items: [], total: 0 }),
    });
    expect(result.status).toBe(400);
  });

  it("uses page number from query", async () => {
    const calls: { page: number }[] = [];
    await handleListGenerations({
      query: { page: "3" },
      session: authedSession,
      listGenerations: async (params) => {
        calls.push(params);
        return { items: [], total: 0 };
      },
    });
    expect(calls[0].page).toBe(3);
  });
});
