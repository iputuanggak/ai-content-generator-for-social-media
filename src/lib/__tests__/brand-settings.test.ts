import { describe, it, expect } from "vitest";

// Pure handler logic for GET/PUT /api/teams/[id]/brand-settings

interface MockSession {
  user: { id: string };
  session: { activeOrganizationId: string | null };
}

interface MockMember {
  organizationId: string;
  userId: string;
  role: string;
}

interface MockBrandSettings {
  id: string;
  organizationId: string;
  brandVoice: string;
  defaultTone: string;
  defaultPlatforms: string[];
  modelId: string;
  updatedAt: Date;
}

async function handleGetBrandSettings({
  teamId,
  session,
  getMember,
  getBrandSettings,
}: {
  teamId: string;
  session: MockSession | null;
  getMember: (orgId: string, userId: string) => Promise<MockMember | null>;
  getBrandSettings: (orgId: string) => Promise<MockBrandSettings | null>;
}): Promise<{ status: number; body: unknown }> {
  if (!session) return { status: 401, body: { error: "Unauthorized" } };

  const member = await getMember(teamId, session.user.id);
  if (!member) return { status: 403, body: { error: "Forbidden" } };

  const settings = await getBrandSettings(teamId);
  if (!settings) return { status: 404, body: { error: "Brand settings not found" } };

  return { status: 200, body: settings };
}

async function handlePutBrandSettings({
  teamId,
  session,
  body,
  getMember,
  updateBrandSettings,
}: {
  teamId: string;
  session: MockSession | null;
  body: unknown;
  getMember: (orgId: string, userId: string) => Promise<MockMember | null>;
  updateBrandSettings: (orgId: string, updates: Partial<MockBrandSettings>) => Promise<MockBrandSettings>;
}): Promise<{ status: number; body: unknown }> {
  if (!session) return { status: 401, body: { error: "Unauthorized" } };

  const member = await getMember(teamId, session.user.id);
  if (!member) return { status: 403, body: { error: "Forbidden" } };

  if (member.role !== "owner" && member.role !== "admin") {
    return { status: 403, body: { error: "Only team admins can edit brand settings" } };
  }

  const updates = body as Partial<MockBrandSettings>;

  // Validate tone if provided
  const validTones = ["professional", "casual", "humorous", "inspirational"];
  if (updates.defaultTone && !validTones.includes(updates.defaultTone)) {
    return { status: 400, body: { error: "Invalid tone" } };
  }

  // Validate platforms if provided
  const validPlatforms = ["twitter", "linkedin", "instagram", "facebook", "tiktok", "youtube", "threads", "pinterest"];
  if (updates.defaultPlatforms) {
    for (const p of updates.defaultPlatforms) {
      if (!validPlatforms.includes(p)) {
        return { status: 400, body: { error: `Invalid platform: ${p}` } };
      }
    }
  }

  const updated = await updateBrandSettings(teamId, updates);
  return { status: 200, body: updated };
}

// Fixtures
const adminSession: MockSession = {
  user: { id: "user-1" },
  session: { activeOrganizationId: "org-1" },
};

const memberSession: MockSession = {
  user: { id: "user-2" },
  session: { activeOrganizationId: "org-1" },
};

const adminMember: MockMember = { organizationId: "org-1", userId: "user-1", role: "owner" };
const nonAdminMember: MockMember = { organizationId: "org-1", userId: "user-2", role: "member" };

const sampleSettings: MockBrandSettings = {
  id: "bs-1",
  organizationId: "org-1",
  brandVoice: "bold and direct",
  defaultTone: "professional",
  defaultPlatforms: ["twitter", "linkedin"],
  modelId: "google/gemini-2.5-flash",
  updatedAt: new Date(),
};

describe("GET /api/teams/[id]/brand-settings", () => {
  it("returns 401 when unauthenticated", async () => {
    const result = await handleGetBrandSettings({
      teamId: "org-1",
      session: null,
      getMember: async () => adminMember,
      getBrandSettings: async () => sampleSettings,
    });
    expect(result.status).toBe(401);
  });

  it("returns 403 when user is not a member of the team", async () => {
    const result = await handleGetBrandSettings({
      teamId: "org-1",
      session: adminSession,
      getMember: async () => null,
      getBrandSettings: async () => sampleSettings,
    });
    expect(result.status).toBe(403);
  });

  it("returns 200 with brand settings for a team member", async () => {
    const result = await handleGetBrandSettings({
      teamId: "org-1",
      session: memberSession,
      getMember: async () => nonAdminMember,
      getBrandSettings: async () => sampleSettings,
    });
    expect(result.status).toBe(200);
    expect(result.body).toEqual(sampleSettings);
  });

  it("returns 200 with brand settings for an admin", async () => {
    const result = await handleGetBrandSettings({
      teamId: "org-1",
      session: adminSession,
      getMember: async () => adminMember,
      getBrandSettings: async () => sampleSettings,
    });
    expect(result.status).toBe(200);
  });

  it("returns 404 when brand settings do not exist", async () => {
    const result = await handleGetBrandSettings({
      teamId: "org-1",
      session: adminSession,
      getMember: async () => adminMember,
      getBrandSettings: async () => null,
    });
    expect(result.status).toBe(404);
  });
});

describe("PUT /api/teams/[id]/brand-settings", () => {
  it("returns 401 when unauthenticated", async () => {
    const result = await handlePutBrandSettings({
      teamId: "org-1",
      session: null,
      body: {},
      getMember: async () => adminMember,
      updateBrandSettings: async () => sampleSettings,
    });
    expect(result.status).toBe(401);
  });

  it("returns 403 when user is not a member", async () => {
    const result = await handlePutBrandSettings({
      teamId: "org-1",
      session: adminSession,
      body: {},
      getMember: async () => null,
      updateBrandSettings: async () => sampleSettings,
    });
    expect(result.status).toBe(403);
  });

  it("returns 403 when user is a non-admin member", async () => {
    const result = await handlePutBrandSettings({
      teamId: "org-1",
      session: memberSession,
      body: { brandVoice: "new voice" },
      getMember: async () => nonAdminMember,
      updateBrandSettings: async () => sampleSettings,
    });
    expect(result.status).toBe(403);
  });

  it("returns 200 and updates brand settings when user is an admin", async () => {
    const calls: { orgId: string; updates: Partial<MockBrandSettings> }[] = [];
    const result = await handlePutBrandSettings({
      teamId: "org-1",
      session: adminSession,
      body: { brandVoice: "new bold voice", defaultTone: "casual" },
      getMember: async () => adminMember,
      updateBrandSettings: async (orgId, updates) => {
        calls.push({ orgId, updates });
        return { ...sampleSettings, ...updates };
      },
    });
    expect(result.status).toBe(200);
    expect(calls[0].updates).toMatchObject({ brandVoice: "new bold voice", defaultTone: "casual" });
  });

  it("returns 400 for invalid tone", async () => {
    const result = await handlePutBrandSettings({
      teamId: "org-1",
      session: adminSession,
      body: { defaultTone: "aggressive" },
      getMember: async () => adminMember,
      updateBrandSettings: async () => sampleSettings,
    });
    expect(result.status).toBe(400);
  });

  it("returns 400 for invalid platform", async () => {
    const result = await handlePutBrandSettings({
      teamId: "org-1",
      session: adminSession,
      body: { defaultPlatforms: ["twitter", "myspace"] },
      getMember: async () => adminMember,
      updateBrandSettings: async () => sampleSettings,
    });
    expect(result.status).toBe(400);
  });

  it("allows updating modelId", async () => {
    const calls: { updates: Partial<MockBrandSettings> }[] = [];
    const result = await handlePutBrandSettings({
      teamId: "org-1",
      session: adminSession,
      body: { modelId: "anthropic/claude-3-5-sonnet" },
      getMember: async () => adminMember,
      updateBrandSettings: async (_, updates) => {
        calls.push({ updates });
        return { ...sampleSettings, ...updates };
      },
    });
    expect(result.status).toBe(200);
    expect(calls[0].updates.modelId).toBe("anthropic/claude-3-5-sonnet");
  });
});
