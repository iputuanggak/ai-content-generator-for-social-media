import { describe, it, expect } from "vitest";

interface MockSession {
  user: { id: string };
  session: { activeOrganizationId: string | null };
}

interface MockGeneration {
  id: string;
  organizationId: string;
}

async function handleDeleteGeneration({
  id,
  session,
  findGeneration,
  deleteGeneration,
}: {
  id: string | undefined;
  session: MockSession | null;
  findGeneration: (id: string) => Promise<MockGeneration | null>;
  deleteGeneration: (id: string) => Promise<void>;
}): Promise<{ status: number; body: unknown }> {
  if (!session) return { status: 401, body: { error: "Unauthorized" } };
  const activeOrgId = session.session.activeOrganizationId;
  if (!activeOrgId) return { status: 400, body: { error: "No active organization" } };

  if (!id) return { status: 400, body: { error: "Missing id" } };

  const gen = await findGeneration(id);
  if (!gen) return { status: 404, body: { error: "Not found" } };

  if (gen.organizationId !== activeOrgId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  await deleteGeneration(id);
  return { status: 200, body: { id } };
}

const authedSession: MockSession = {
  user: { id: "user-1" },
  session: { activeOrganizationId: "org-1" },
};

const fakeGeneration: MockGeneration = { id: "gen-1", organizationId: "org-1" };

describe("DELETE /api/generations/[id] logic", () => {
  it("returns 401 when unauthenticated", async () => {
    const result = await handleDeleteGeneration({
      id: "gen-1",
      session: null,
      findGeneration: async () => fakeGeneration,
      deleteGeneration: async () => {},
    });
    expect(result.status).toBe(401);
  });

  it("returns 400 when no active org", async () => {
    const result = await handleDeleteGeneration({
      id: "gen-1",
      session: { user: { id: "u" }, session: { activeOrganizationId: null } },
      findGeneration: async () => fakeGeneration,
      deleteGeneration: async () => {},
    });
    expect(result.status).toBe(400);
  });

  it("returns 404 when generation not found", async () => {
    const result = await handleDeleteGeneration({
      id: "gen-1",
      session: authedSession,
      findGeneration: async () => null,
      deleteGeneration: async () => {},
    });
    expect(result.status).toBe(404);
  });

  it("returns 403 when generation belongs to different org", async () => {
    const result = await handleDeleteGeneration({
      id: "gen-1",
      session: authedSession,
      findGeneration: async () => ({ id: "gen-1", organizationId: "other-org" }),
      deleteGeneration: async () => {},
    });
    expect(result.status).toBe(403);
  });

  it("deletes generation and returns 200", async () => {
    const deleted: string[] = [];
    const result = await handleDeleteGeneration({
      id: "gen-1",
      session: authedSession,
      findGeneration: async () => fakeGeneration,
      deleteGeneration: async (id) => {
        deleted.push(id);
      },
    });
    expect(result.status).toBe(200);
    expect(deleted).toContain("gen-1");
  });
});
