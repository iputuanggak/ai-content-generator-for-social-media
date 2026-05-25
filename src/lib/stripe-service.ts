import Stripe from "stripe";
import { getPackage, getStripePriceId } from "./packages";
import { addTopUpCredits } from "./credit-service";

export interface StripeServiceDeps {
  stripeClient?: Stripe;
  addTopUp?: typeof addTopUpCredits;
  findExistingBatchBySessionId?: (sessionId: string) => Promise<boolean>;
}

function getStripeClient(deps?: StripeServiceDeps): Stripe {
  if (deps?.stripeClient) return deps.stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

export async function createCheckoutSession(
  orgId: string,
  packageSlug: string,
  memberId: string,
  slug: string,
  deps?: StripeServiceDeps
): Promise<string> {
  const pkg = getPackage(packageSlug);
  if (!pkg) throw new Error(`Invalid package: ${packageSlug}`);

  const priceId = getStripePriceId(pkg);
  if (!priceId) throw new Error(`Price not configured for package: ${packageSlug}`);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripeClient(deps);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/${slug}/credits?topup=success`,
    cancel_url: `${baseUrl}/${slug}/credits?topup=cancelled`,
    metadata: {
      orgId,
      memberId,
      packageSlug,
    },
  });

  return session.url!;
}

export async function verifyAndHandleWebhook(
  rawBody: string | Buffer,
  signature: string,
  deps?: StripeServiceDeps
): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

  const stripe = getStripeClient(deps);
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  if (event.type !== "checkout.session.completed") return;

  const session = event.data.object as Stripe.Checkout.Session;
  const { orgId, memberId, packageSlug } = session.metadata ?? {};

  if (!orgId || !memberId || !packageSlug) return;

  const sessionId = session.id;

  const findExisting = deps?.findExistingBatchBySessionId ?? defaultFindExisting;
  const alreadyExists = await findExisting(sessionId);
  if (alreadyExists) return;

  const pkg = getPackage(packageSlug);
  if (!pkg) return;

  const addTopUp = deps?.addTopUp ?? addTopUpCredits;
  await addTopUp(orgId, pkg.credits, sessionId, memberId);
}

async function defaultFindExisting(sessionId: string): Promise<boolean> {
  const { db } = await import("./db");
  const { creditBatch } = await import("./db/schema");
  const { eq } = await import("drizzle-orm");

  const rows = await db
    .select({ id: creditBatch.id })
    .from(creditBatch)
    .where(eq(creditBatch.stripeSessionId, sessionId))
    .limit(1);

  return rows.length > 0;
}
