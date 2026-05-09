import { describe, it, expect } from "vitest";

interface MockSession {
  user: { id: string };
  session: { activeOrganizationId: string | null };
}

interface MockGeneration {
  id: string;
  organizationId: string;
}

async function handlePatchGeneration({
  id,
  body,
  session,
  findGeneration,
  updateGeneration,
}: {
  id: string | undefined;
  body: unknown;
  session: MockSession | null;
  findGeneration: (id: string) => Promise<MockGeneration | null>;
  updateGeneration: (id: string, intendedPublishAt: Date | null) => Promise<void>;
}): Promise<{ status: number; body: unknown }> {
  if (!session) return { status: 401, body: { error: "Unauthorized" } };
  if (!session.session.activeOrganizationId)
    return { status: 400, body: { error: "No active organization" } };

  if (!id) return { status: 400, body: { error: "Missing id" } };

  const raw = (body as Record<string, unknown>) ?? {};
  const { intendedPublishAt } = raw;

  // Allow null to clear the date
  let publishDate: Date | null = null;
  if (intendedPublishAt !== null && intendedPublishAt !== undefined) {
    const parsed = new Date(intendedPublishAt as string);
    if (isNaN(parsed.getTime())) {
      return { status: 400, body: { error: "Invalid intendedPublishAt" } };
    }
    publishDate = parsed;
  }

  const gen = await findGeneration(id);
  if (!gen) return { status: 404, body: { error: "Not found" } };

  if (gen.organizationId !== session.session.activeOrganizationId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  await updateGeneration(id, publishDate);
  return { status: 200, body: { id, intendedPublishAt: publishDate?.toISOString() ?? null } };
}

const fakeGeneration: MockGeneration = { id: "gen-1", organizationId: "org-1" };
const authedSession: MockSession = {
  user: { id: "user-1" },
  session: { activeOrganizationId: "org-1" },
};

describe("PATCH /api/generations/[id] logic", () => {
  it("returns 401 when unauthenticated", async () => {
    const result = await handlePatchGeneration({
      id: "gen-1",
      body: { intendedPublishAt: "2026-01-01T12:00:00Z" },
      session: null,
      findGeneration: async () => fakeGeneration,
      updateGeneration: async () => {},
    });
    expect(result.status).toBe(401);
  });

  it("returns 400 for invalid date string", async () => {
    const result = await handlePatchGeneration({
      id: "gen-1",
      body: { intendedPublishAt: "not-a-date" },
      session: authedSession,
      findGeneration: async () => fakeGeneration,
      updateGeneration: async () => {},
    });
    expect(result.status).toBe(400);
  });

  it("returns 403 when generation belongs to different org", async () => {
    const result = await handlePatchGeneration({
      id: "gen-1",
      body: { intendedPublishAt: "2026-01-01T12:00:00Z" },
      session: authedSession,
      findGeneration: async () => ({ id: "gen-1", organizationId: "other-org" }),
      updateGeneration: async () => {},
    });
    expect(result.status).toBe(403);
  });

  it("returns 404 when generation not found", async () => {
    const result = await handlePatchGeneration({
      id: "gen-1",
      body: { intendedPublishAt: "2026-01-01T12:00:00Z" },
      session: authedSession,
      findGeneration: async () => null,
      updateGeneration: async () => {},
    });
    expect(result.status).toBe(404);
  });

  it("persists intendedPublishAt and returns 200", async () => {
    const updates: { id: string; date: Date | null }[] = [];
    const result = await handlePatchGeneration({
      id: "gen-1",
      body: { intendedPublishAt: "2026-06-15T09:00:00Z" },
      session: authedSession,
      findGeneration: async () => fakeGeneration,
      updateGeneration: async (id, date) => {
        updates.push({ id, date });
      },
    });
    expect(result.status).toBe(200);
    expect(updates[0].id).toBe("gen-1");
    expect(updates[0].date?.toISOString()).toBe("2026-06-15T09:00:00.000Z");
  });

  it("allows clearing intendedPublishAt with null", async () => {
    const updates: { id: string; date: Date | null }[] = [];
    await handlePatchGeneration({
      id: "gen-1",
      body: { intendedPublishAt: null },
      session: authedSession,
      findGeneration: async () => fakeGeneration,
      updateGeneration: async (id, date) => {
        updates.push({ id, date });
      },
    });
    expect(updates[0].date).toBeNull();
  });
});
