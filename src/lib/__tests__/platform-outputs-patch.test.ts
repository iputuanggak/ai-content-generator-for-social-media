import { describe, it, expect } from "vitest";

// Pure handler logic extracted for testing — mirrors the PATCH /api/platform-outputs/[id] handler
// The handler needs:
//  - auth check → 401 if no session
//  - body validation → 400 if editedContent missing
//  - ownership check → 403 if platformOutput doesn't belong to the active org
//  - persist editedContent → 200 { id, editedContent }

interface MockSession {
  user: { id: string };
  session: { activeOrganizationId: string | null };
}

interface MockPlatformOutput {
  id: string;
  generationId: string;
  content: string;
  editedContent: string | null;
}

interface MockGeneration {
  id: string;
  organizationId: string;
}

type UpdateResult = { id: string; editedContent: string };

async function handlePatchPlatformOutput({
  id,
  body,
  session,
  findPlatformOutput,
  findGeneration,
  updatePlatformOutput,
}: {
  id: string | undefined;
  body: unknown;
  session: MockSession | null;
  findPlatformOutput: (id: string) => Promise<MockPlatformOutput | null>;
  findGeneration: (id: string) => Promise<MockGeneration | null>;
  updatePlatformOutput: (id: string, editedContent: string) => Promise<void>;
}): Promise<{ status: number; body: unknown }> {
  if (!session) return { status: 401, body: { error: "Unauthorized" } };
  if (!session.session.activeOrganizationId)
    return { status: 400, body: { error: "No active organization" } };

  if (!id) return { status: 400, body: { error: "Missing id" } };

  const { editedContent } = (body as Record<string, unknown>) ?? {};
  if (typeof editedContent !== "string")
    return { status: 400, body: { error: "editedContent is required" } };

  const output = await findPlatformOutput(id);
  if (!output) return { status: 404, body: { error: "Not found" } };

  const gen = await findGeneration(output.generationId);
  if (!gen || gen.organizationId !== session.session.activeOrganizationId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  await updatePlatformOutput(id, editedContent);
  return { status: 200, body: { id, editedContent } };
}

const fakeOutput: MockPlatformOutput = {
  id: "po-1",
  generationId: "gen-1",
  content: "original",
  editedContent: null,
};

const fakeGeneration: MockGeneration = {
  id: "gen-1",
  organizationId: "org-1",
};

const authedSession: MockSession = {
  user: { id: "user-1" },
  session: { activeOrganizationId: "org-1" },
};

describe("PATCH /api/platform-outputs/[id] logic", () => {
  it("returns 401 when unauthenticated", async () => {
    const result = await handlePatchPlatformOutput({
      id: "po-1",
      body: { editedContent: "new" },
      session: null,
      findPlatformOutput: async () => fakeOutput,
      findGeneration: async () => fakeGeneration,
      updatePlatformOutput: async () => {},
    });
    expect(result.status).toBe(401);
  });

  it("returns 400 when editedContent is missing", async () => {
    const result = await handlePatchPlatformOutput({
      id: "po-1",
      body: {},
      session: authedSession,
      findPlatformOutput: async () => fakeOutput,
      findGeneration: async () => fakeGeneration,
      updatePlatformOutput: async () => {},
    });
    expect(result.status).toBe(400);
  });

  it("returns 404 when platform output not found", async () => {
    const result = await handlePatchPlatformOutput({
      id: "nonexistent",
      body: { editedContent: "new" },
      session: authedSession,
      findPlatformOutput: async () => null,
      findGeneration: async () => fakeGeneration,
      updatePlatformOutput: async () => {},
    });
    expect(result.status).toBe(404);
  });

  it("returns 403 when generation belongs to different org", async () => {
    const result = await handlePatchPlatformOutput({
      id: "po-1",
      body: { editedContent: "new" },
      session: authedSession,
      findPlatformOutput: async () => fakeOutput,
      findGeneration: async () => ({ id: "gen-1", organizationId: "other-org" }),
      updatePlatformOutput: async () => {},
    });
    expect(result.status).toBe(403);
  });

  it("calls updatePlatformOutput and returns 200 on success", async () => {
    const updates: { id: string; content: string }[] = [];
    const result = await handlePatchPlatformOutput({
      id: "po-1",
      body: { editedContent: "updated text" },
      session: authedSession,
      findPlatformOutput: async () => fakeOutput,
      findGeneration: async () => fakeGeneration,
      updatePlatformOutput: async (id, content) => {
        updates.push({ id, content });
      },
    });
    expect(result.status).toBe(200);
    expect(updates).toEqual([{ id: "po-1", content: "updated text" }]);
    expect((result.body as UpdateResult).editedContent).toBe("updated text");
  });
});
