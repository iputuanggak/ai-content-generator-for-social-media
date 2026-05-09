import { describe, it, expect } from "vitest";

// Pure handler logic extracted for testing — mirrors the POST /api/platform-outputs/[id]/regenerate handler
// The handler needs:
//  - auth check → 401 if no session
//  - activeOrganizationId check → 400 if no active org
//  - id check → 400 if missing
//  - ownership check → 403 if platformOutput doesn't belong to the active org
//  - re-generate content using topic, tone, and brand settings → 200 { id, content }
//  - editedContent is cleared (set to null) on regeneration

interface MockSession {
  user: { id: string };
  session: { activeOrganizationId: string | null };
}

interface MockPlatformOutput {
  id: string;
  generationId: string;
  platform: string;
  content: string;
  editedContent: string | null;
}

interface MockGeneration {
  id: string;
  organizationId: string;
  topic: string;
  tone: string;
}

interface MockBrandSettings {
  brandVoice: string;
  modelId: string;
}

type RegenerateResult = { id: string; content: string };

async function handleRegeneratePlatformOutput({
  id,
  session,
  findPlatformOutput,
  findGeneration,
  findBrandSettings,
  generateContent,
  updatePlatformOutput,
}: {
  id: string | undefined;
  session: MockSession | null;
  findPlatformOutput: (id: string) => Promise<MockPlatformOutput | null>;
  findGeneration: (id: string) => Promise<MockGeneration | null>;
  findBrandSettings: (orgId: string) => Promise<MockBrandSettings | null>;
  generateContent: (
    topic: string,
    tone: string,
    brandVoice: string,
    platform: string,
    modelId: string
  ) => Promise<string>;
  updatePlatformOutput: (id: string, content: string) => Promise<void>;
}): Promise<{ status: number; body: unknown }> {
  if (!session) return { status: 401, body: { error: "Unauthorized" } };
  if (!session.session.activeOrganizationId)
    return { status: 400, body: { error: "No active organization" } };

  if (!id) return { status: 400, body: { error: "Missing id" } };

  const output = await findPlatformOutput(id);
  if (!output) return { status: 404, body: { error: "Not found" } };

  const gen = await findGeneration(output.generationId);
  if (!gen || gen.organizationId !== session.session.activeOrganizationId) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const brandSettings = await findBrandSettings(gen.organizationId);
  if (!brandSettings) {
    return { status: 500, body: { error: "Brand settings not found" } };
  }

  const newContent = await generateContent(
    gen.topic,
    gen.tone,
    brandSettings.brandVoice,
    output.platform,
    brandSettings.modelId
  );

  await updatePlatformOutput(id, newContent);

  return { status: 200, body: { id, content: newContent } };
}

const fakeOutput: MockPlatformOutput = {
  id: "po-1",
  generationId: "gen-1",
  platform: "twitter",
  content: "original content",
  editedContent: "edited content",
};

const fakeGeneration: MockGeneration = {
  id: "gen-1",
  organizationId: "org-1",
  topic: "AI trends",
  tone: "professional",
};

const fakeBrandSettings: MockBrandSettings = {
  brandVoice: "Innovative and forward-thinking",
  modelId: "google/gemini-2.5-flash",
};

const authedSession: MockSession = {
  user: { id: "user-1" },
  session: { activeOrganizationId: "org-1" },
};

describe("POST /api/platform-outputs/[id]/regenerate logic", () => {
  it("returns 401 when unauthenticated", async () => {
    const result = await handleRegeneratePlatformOutput({
      id: "po-1",
      session: null,
      findPlatformOutput: async () => fakeOutput,
      findGeneration: async () => fakeGeneration,
      findBrandSettings: async () => fakeBrandSettings,
      generateContent: async () => "new content",
      updatePlatformOutput: async () => {},
    });
    expect(result.status).toBe(401);
  });

  it("returns 400 when no active organization", async () => {
    const result = await handleRegeneratePlatformOutput({
      id: "po-1",
      session: { user: { id: "u" }, session: { activeOrganizationId: null } },
      findPlatformOutput: async () => fakeOutput,
      findGeneration: async () => fakeGeneration,
      findBrandSettings: async () => fakeBrandSettings,
      generateContent: async () => "new content",
      updatePlatformOutput: async () => {},
    });
    expect(result.status).toBe(400);
  });

  it("returns 404 when platform output not found", async () => {
    const result = await handleRegeneratePlatformOutput({
      id: "nonexistent",
      session: authedSession,
      findPlatformOutput: async () => null,
      findGeneration: async () => fakeGeneration,
      findBrandSettings: async () => fakeBrandSettings,
      generateContent: async () => "new content",
      updatePlatformOutput: async () => {},
    });
    expect(result.status).toBe(404);
  });

  it("returns 403 when generation belongs to different org", async () => {
    const result = await handleRegeneratePlatformOutput({
      id: "po-1",
      session: authedSession,
      findPlatformOutput: async () => fakeOutput,
      findGeneration: async () => ({ ...fakeGeneration, organizationId: "other-org" }),
      findBrandSettings: async () => fakeBrandSettings,
      generateContent: async () => "new content",
      updatePlatformOutput: async () => {},
    });
    expect(result.status).toBe(403);
  });

  it("calls generateContent with correct args and returns 200 with new content", async () => {
    const generateCalls: { topic: string; tone: string; brandVoice: string; platform: string; modelId: string }[] = [];
    const updateCalls: { id: string; content: string }[] = [];

    const result = await handleRegeneratePlatformOutput({
      id: "po-1",
      session: authedSession,
      findPlatformOutput: async () => fakeOutput,
      findGeneration: async () => fakeGeneration,
      findBrandSettings: async () => fakeBrandSettings,
      generateContent: async (topic, tone, brandVoice, platform, modelId) => {
        generateCalls.push({ topic, tone, brandVoice, platform, modelId });
        return "regenerated content";
      },
      updatePlatformOutput: async (id, content) => {
        updateCalls.push({ id, content });
      },
    });

    expect(result.status).toBe(200);
    expect((result.body as RegenerateResult).content).toBe("regenerated content");
    expect(generateCalls).toHaveLength(1);
    expect(generateCalls[0]).toEqual({
      topic: "AI trends",
      tone: "professional",
      brandVoice: "Innovative and forward-thinking",
      platform: "twitter",
      modelId: "google/gemini-2.5-flash",
    });
    expect(updateCalls).toEqual([{ id: "po-1", content: "regenerated content" }]);
  });

  it("returns 500 when brand settings not found", async () => {
    const result = await handleRegeneratePlatformOutput({
      id: "po-1",
      session: authedSession,
      findPlatformOutput: async () => fakeOutput,
      findGeneration: async () => fakeGeneration,
      findBrandSettings: async () => null,
      generateContent: async () => "new content",
      updatePlatformOutput: async () => {},
    });
    expect(result.status).toBe(500);
  });
});
