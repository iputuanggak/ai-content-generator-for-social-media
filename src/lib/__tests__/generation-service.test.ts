import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateContent } from "../generation-service";
import type { GenerationServiceDeps } from "../generation-service";

// Mock db client
function makeDbClient(brandSettingsRows: object[]) {
  const insertedRows: { table: string; values: object }[] = [];

  const mockDbClient = {
    select: () => ({
      from: (_table: unknown) => ({
        where: (_condition: unknown) => ({
          limit: (_n: number) => Promise.resolve(brandSettingsRows),
        }),
      }),
    }),
    insert: (_table: unknown) => ({
      values: (values: object) => {
        insertedRows.push({ table: String(_table), values });
        return Promise.resolve();
      },
    }),
    _insertedRows: insertedRows,
  };

  return mockDbClient as unknown as Parameters<typeof generateContent>[1]["dbClient"] & {
    _insertedRows: typeof insertedRows;
  };
}

const defaultBrandSettings = {
  id: "bs-1",
  organizationId: "org-1",
  brandVoice: "bold and direct",
  defaultTone: "professional",
  activePlatforms: ["twitter", "linkedin"],
  modelId: "google/gemini-2.5-flash",
  updatedAt: new Date(),
};

function makeFetch(content: string) {
  return async () =>
    ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({
        choices: [{ message: { content } }],
      }),
    }) as Response;
}

describe("Generation Service – generateContent", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  it("returns platform outputs for all active platforms", async () => {
    const dbClient = makeDbClient([defaultBrandSettings]);
    const deps: GenerationServiceDeps = {
      dbClient,
      openRouterFetch: makeFetch("Generated post"),
    };

    const result = await generateContent(
      { organizationId: "org-1", memberId: "member-1", topic: "AI news", tone: "professional" },
      deps
    );

    expect(result.platformOutputs).toHaveLength(2);
    expect(result.platformOutputs.map((o) => o.platform)).toEqual(["twitter", "linkedin"]);
  });

  it("persists a generation record and platform output rows", async () => {
    const dbClient = makeDbClient([defaultBrandSettings]);
    const deps: GenerationServiceDeps = {
      dbClient,
      openRouterFetch: makeFetch("post content"),
    };

    await generateContent(
      { organizationId: "org-1", memberId: "member-1", topic: "topic", tone: "casual" },
      deps
    );

    // 3 inserts: 1 generation + 2 platform outputs (one per platform, inserted individually)
    expect(dbClient._insertedRows).toHaveLength(3);
  });

  it("throws when brand settings are not found", async () => {
    const dbClient = makeDbClient([]); // empty
    const deps: GenerationServiceDeps = {
      dbClient,
      openRouterFetch: makeFetch("post"),
    };

    await expect(
      generateContent(
        { organizationId: "unknown-org", memberId: "m1", topic: "topic", tone: "casual" },
        deps
      )
    ).rejects.toThrow("Brand settings not found");
  });

  it("calls onPlatformOutput for each platform as it completes", async () => {
    const dbClient = makeDbClient([defaultBrandSettings]);
    const notified: string[] = [];
    const deps: GenerationServiceDeps = {
      dbClient,
      openRouterFetch: makeFetch("post"),
    };

    await generateContent(
      {
        organizationId: "org-1",
        memberId: "member-1",
        topic: "AI news",
        tone: "professional",
        onPlatformOutput: ({ platform }) => {
          notified.push(platform);
        },
      },
      deps
    );

    expect(notified).toHaveLength(2);
    expect(notified.sort()).toEqual(["linkedin", "twitter"]);
  });

  it("uses the brand voice from brand settings in prompt (smoke test via fetch body)", async () => {
    const dbClient = makeDbClient([defaultBrandSettings]);
    let capturedBody: string | null = null;
    const fetchFn = async (_url: string | URL | Request, init?: RequestInit) => {
      if (init?.body && !capturedBody) capturedBody = init.body as string;
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ choices: [{ message: { content: "post" } }] }),
      } as Response;
    };

    await generateContent(
      { organizationId: "org-1", memberId: "m1", topic: "topic", tone: "casual" },
      { dbClient, openRouterFetch: fetchFn }
    );

    expect(capturedBody).toContain("bold and direct");
  });
});
