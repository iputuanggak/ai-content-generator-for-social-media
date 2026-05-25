import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createCheckoutSession,
  verifyAndHandleWebhook,
} from "../stripe-service";
import type Stripe from "stripe";

function makeStripeMock(overrides?: {
  createSession?: Partial<Stripe.Checkout.Session>;
}): {
  stripeClient: Stripe;
  sessionsCreate: ReturnType<typeof vi.fn>;
  constructEvent: ReturnType<typeof vi.fn>;
} {
  const sessionsCreate = vi.fn().mockResolvedValue({
    id: "cs_test_123",
    url: "https://checkout.stripe.com/test",
    ...overrides?.createSession,
  });

  const constructEvent = vi.fn();

  const stripeClient = {
    checkout: {
      sessions: {
        create: sessionsCreate,
      },
    },
    webhooks: {
      constructEvent,
    },
  } as unknown as Stripe;

  return { stripeClient, sessionsCreate, constructEvent };
}

describe("Stripe Service – createCheckoutSession", () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv, STRIPE_SECRET_KEY: "sk_test_123", STRIPE_PRICE_STARTER: "price_starter", STRIPE_PRICE_GROWTH: "price_growth", STRIPE_PRICE_PRO: "price_pro", NEXT_PUBLIC_APP_URL: "http://localhost:3000" };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it("creates a session with correct metadata and urls", async () => {
    const { stripeClient, sessionsCreate } = makeStripeMock();

    const url = await createCheckoutSession("org-1", "starter", "mem-1", "my-team", { stripeClient });

    expect(url).toBe("https://checkout.stripe.com/test");
    expect(sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        success_url: "http://localhost:3000/my-team/credits?topup=success",
        cancel_url: "http://localhost:3000/my-team/credits?topup=cancelled",
        metadata: { orgId: "org-1", memberId: "mem-1", packageSlug: "starter" },
      })
    );
  });

  it("uses the correct price id for the package", async () => {
    const { stripeClient, sessionsCreate } = makeStripeMock();

    await createCheckoutSession("org-1", "growth", "mem-1", "my-team", { stripeClient });

    expect(sessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: "price_growth", quantity: 1 }],
      })
    );
  });

  it("throws for invalid package slug", async () => {
    const { stripeClient } = makeStripeMock();

    await expect(
      createCheckoutSession("org-1", "invalid", "mem-1", "my-team", { stripeClient })
    ).rejects.toThrow("Invalid package");
  });

  it("throws when price id is not configured", async () => {
    const { stripeClient } = makeStripeMock();
    delete process.env.STRIPE_PRICE_STARTER;

    await expect(
      createCheckoutSession("org-1", "starter", "mem-1", "my-team", { stripeClient })
    ).rejects.toThrow("Price not configured");
  });
});

describe("Stripe Service – verifyAndHandleWebhook", () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv, STRIPE_WEBHOOK_SECRET: "whsec_test" };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  function makeCompletedEvent(metadata: Record<string, string>, sessionId = "cs_test_123") {
    return {
      type: "checkout.session.completed",
      data: {
        object: {
          id: sessionId,
          metadata,
        },
      },
    };
  }

  it("processes checkout.session.completed and calls addTopUpCredits", async () => {
    const { stripeClient, constructEvent } = makeStripeMock();
    const addTopUp = vi.fn().mockResolvedValue(undefined);
    const findExisting = vi.fn().mockResolvedValue(false);

    constructEvent.mockReturnValue(makeCompletedEvent({ orgId: "org-1", memberId: "mem-1", packageSlug: "starter" }));

    await verifyAndHandleWebhook("raw-body", "sig-test", {
      stripeClient,
      addTopUp,
      findExistingBatchBySessionId: findExisting,
    });

    expect(addTopUp).toHaveBeenCalledWith("org-1", 100, "cs_test_123", "mem-1");
  });

  it("ignores non-checkout event types", async () => {
    const { stripeClient, constructEvent } = makeStripeMock();
    const addTopUp = vi.fn();

    constructEvent.mockReturnValue({ type: "payment_intent.created", data: { object: {} } });

    await verifyAndHandleWebhook("raw-body", "sig-test", {
      stripeClient,
      addTopUp,
      findExistingBatchBySessionId: vi.fn(),
    });

    expect(addTopUp).not.toHaveBeenCalled();
  });

  it("handles duplicate webhook events idempotently", async () => {
    const { stripeClient, constructEvent } = makeStripeMock();
    const addTopUp = vi.fn();
    const findExisting = vi.fn().mockResolvedValue(true);

    constructEvent.mockReturnValue(makeCompletedEvent({ orgId: "org-1", memberId: "mem-1", packageSlug: "starter" }));

    await verifyAndHandleWebhook("raw-body", "sig-test", {
      stripeClient,
      addTopUp,
      findExistingBatchBySessionId: findExisting,
    });

    expect(findExisting).toHaveBeenCalledWith("cs_test_123");
    expect(addTopUp).not.toHaveBeenCalled();
  });

  it("skips processing when metadata is missing", async () => {
    const { stripeClient, constructEvent } = makeStripeMock();
    const addTopUp = vi.fn();
    const findExisting = vi.fn().mockResolvedValue(false);

    constructEvent.mockReturnValue(makeCompletedEvent({}));

    await verifyAndHandleWebhook("raw-body", "sig-test", {
      stripeClient,
      addTopUp,
      findExistingBatchBySessionId: findExisting,
    });

    expect(addTopUp).not.toHaveBeenCalled();
  });

  it("skips processing when package slug is unknown", async () => {
    const { stripeClient, constructEvent } = makeStripeMock();
    const addTopUp = vi.fn();
    const findExisting = vi.fn().mockResolvedValue(false);

    constructEvent.mockReturnValue(makeCompletedEvent({ orgId: "org-1", memberId: "mem-1", packageSlug: "unknown" }));

    await verifyAndHandleWebhook("raw-body", "sig-test", {
      stripeClient,
      addTopUp,
      findExistingBatchBySessionId: findExisting,
    });

    expect(addTopUp).not.toHaveBeenCalled();
  });

  it("throws when webhook signature is invalid", async () => {
    const { stripeClient, constructEvent } = makeStripeMock();

    constructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    await expect(
      verifyAndHandleWebhook("raw-body", "bad-sig", { stripeClient })
    ).rejects.toThrow("Invalid signature");
  });

  it("uses growth package credits (500) correctly", async () => {
    const { stripeClient, constructEvent } = makeStripeMock();
    const addTopUp = vi.fn().mockResolvedValue(undefined);
    const findExisting = vi.fn().mockResolvedValue(false);

    constructEvent.mockReturnValue(makeCompletedEvent({ orgId: "org-1", memberId: "mem-1", packageSlug: "growth" }));

    await verifyAndHandleWebhook("raw-body", "sig-test", {
      stripeClient,
      addTopUp,
      findExistingBatchBySessionId: findExisting,
    });

    expect(addTopUp).toHaveBeenCalledWith("org-1", 500, "cs_test_123", "mem-1");
  });

  it("uses pro package credits (2000) correctly", async () => {
    const { stripeClient, constructEvent } = makeStripeMock();
    const addTopUp = vi.fn().mockResolvedValue(undefined);
    const findExisting = vi.fn().mockResolvedValue(false);

    constructEvent.mockReturnValue(makeCompletedEvent({ orgId: "org-1", memberId: "mem-1", packageSlug: "pro" }));

    await verifyAndHandleWebhook("raw-body", "sig-test", {
      stripeClient,
      addTopUp,
      findExistingBatchBySessionId: findExisting,
    });

    expect(addTopUp).toHaveBeenCalledWith("org-1", 2000, "cs_test_123", "mem-1");
  });
});
