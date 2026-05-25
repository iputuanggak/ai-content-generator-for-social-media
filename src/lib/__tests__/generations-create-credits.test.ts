import { describe, it, expect } from "vitest";

// Pure handler logic for POST /api/generations with credit integration
// Tests: credit check before generation, 402 when insufficient, deduction per platform output

interface MockSession {
  user: { id: string };
  session: { activeOrganizationId: string | null };
}

interface MockBrandSettings {
  activePlatforms: string[];
}

interface CreditCheckResult {
  sufficient: boolean;
  available: number;
  required: number;
}

async function handleCreateGeneration({
  topic,
  tone,
  session,
  findBrandSettings,
  checkCredits,
  generateContent,
  deductCredits,
}: {
  topic: string | undefined;
  tone: string | undefined;
  session: MockSession | null;
  findBrandSettings: (orgId: string) => Promise<MockBrandSettings | null>;
  checkCredits: (orgId: string, amount: number) => Promise<CreditCheckResult>;
  generateContent: (input: {
    orgId: string;
    memberId: string;
    topic: string;
    tone: string;
    onPlatformOutput: (result: { platformOutputId: string }) => Promise<void>;
  }) => Promise<void>;
  deductCredits: (orgId: string, amount: number, type: string, refId: string, memberId: string) => Promise<void>;
}): Promise<{ status: number; body: unknown }> {
  if (!session) return { status: 401, body: { error: "Unauthorized" } };
  const activeOrgId = session.session.activeOrganizationId;
  if (!activeOrgId) return { status: 400, body: { error: "No active organization" } };

  if (!topic || typeof topic !== "string" || topic.trim() === "") {
    return { status: 400, body: { error: "topic is required" } };
  }
  if (!tone) return { status: 400, body: { error: "tone must be a valid value" } };

  const settings = await findBrandSettings(activeOrgId);
  if (!settings) return { status: 500, body: { error: "Brand settings not found" } };

  const platformCount = settings.activePlatforms.length;

  const creditCheck = await checkCredits(activeOrgId, platformCount);
  if (!creditCheck.sufficient) {
    return { status: 402, body: { error: "Insufficient credits", required: platformCount, available: creditCheck.available } };
  }

  await generateContent({
    orgId: activeOrgId,
    memberId: "member-1",
    topic: topic.trim(),
    tone,
    onPlatformOutput: async ({ platformOutputId }) => {
      await deductCredits(activeOrgId, 1, "generation", platformOutputId, "member-1");
    },
  });

  return { status: 200, body: { success: true } };
}

const authedSession: MockSession = {
  user: { id: "user-1" },
  session: { activeOrganizationId: "org-1" },
};

describe("POST /api/generations credit integration", () => {
  it("returns 402 when insufficient credits", async () => {
    const result = await handleCreateGeneration({
      topic: "AI trends",
      tone: "professional",
      session: authedSession,
      findBrandSettings: async () => ({ activePlatforms: ["twitter", "linkedin", "instagram"] }),
      checkCredits: async () => ({ sufficient: false, available: 1, required: 3 }),
      generateContent: async () => {},
      deductCredits: async () => {},
    });

    expect(result.status).toBe(402);
    const body = result.body as { error: string; required: number; available: number };
    expect(body.error).toBe("Insufficient credits");
    expect(body.required).toBe(3);
    expect(body.available).toBe(1);
  });

  it("checks credits for the number of active platforms", async () => {
    const checkCalls: { orgId: string; amount: number }[] = [];

    await handleCreateGeneration({
      topic: "AI trends",
      tone: "professional",
      session: authedSession,
      findBrandSettings: async () => ({ activePlatforms: ["twitter", "linkedin"] }),
      checkCredits: async (orgId, amount) => {
        checkCalls.push({ orgId, amount });
        return { sufficient: true, available: 25, required: amount };
      },
      generateContent: async () => {},
      deductCredits: async () => {},
    });

    expect(checkCalls).toHaveLength(1);
    expect(checkCalls[0].amount).toBe(2);
  });

  it("deducts 1 credit per successful platform output", async () => {
    const deductionCalls: { amount: number; type: string; refId: string }[] = [];

    await handleCreateGeneration({
      topic: "AI trends",
      tone: "professional",
      session: authedSession,
      findBrandSettings: async () => ({ activePlatforms: ["twitter", "linkedin"] }),
      checkCredits: async () => ({ sufficient: true, available: 25, required: 2 }),
      generateContent: async ({ onPlatformOutput }) => {
        await onPlatformOutput({ platformOutputId: "po-1" });
        await onPlatformOutput({ platformOutputId: "po-2" });
      },
      deductCredits: async (_orgId, amount, type, refId) => {
        deductionCalls.push({ amount, type, refId });
      },
    });

    expect(deductionCalls).toHaveLength(2);
    expect(deductionCalls[0]).toEqual({ amount: 1, type: "generation", refId: "po-1" });
    expect(deductionCalls[1]).toEqual({ amount: 1, type: "generation", refId: "po-2" });
  });

  it("only deducts for platform outputs that succeed", async () => {
    const deductionCalls: { refId: string }[] = [];

    await handleCreateGeneration({
      topic: "AI trends",
      tone: "professional",
      session: authedSession,
      findBrandSettings: async () => ({ activePlatforms: ["twitter", "linkedin", "instagram"] }),
      checkCredits: async () => ({ sufficient: true, available: 25, required: 3 }),
      generateContent: async ({ onPlatformOutput }) => {
        await onPlatformOutput({ platformOutputId: "po-1" });
        // po-2 fails (no callback)
        await onPlatformOutput({ platformOutputId: "po-3" });
      },
      deductCredits: async (_orgId, _amount, _type, refId) => {
        deductionCalls.push({ refId });
      },
    });

    expect(deductionCalls).toHaveLength(2);
    expect(deductionCalls.map((d) => d.refId)).toEqual(["po-1", "po-3"]);
  });

  it("does not deduct when credit check fails", async () => {
    const deductionCalls: { refId: string }[] = [];

    await handleCreateGeneration({
      topic: "AI trends",
      tone: "professional",
      session: authedSession,
      findBrandSettings: async () => ({ activePlatforms: ["twitter"] }),
      checkCredits: async () => ({ sufficient: false, available: 0, required: 1 }),
      generateContent: async () => {},
      deductCredits: async (_orgId, _amount, _type, refId) => {
        deductionCalls.push({ refId });
      },
    });

    expect(deductionCalls).toHaveLength(0);
  });

  it("returns 400 when topic is missing", async () => {
    const result = await handleCreateGeneration({
      topic: undefined,
      tone: "professional",
      session: authedSession,
      findBrandSettings: async () => ({ activePlatforms: ["twitter"] }),
      checkCredits: async () => ({ sufficient: true, available: 25, required: 1 }),
      generateContent: async () => {},
      deductCredits: async () => {},
    });

    expect(result.status).toBe(400);
  });
});
