# Setup Guidelines

## Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) account (free tier works)
- An [OpenRouter](https://openrouter.ai) API key
- A [Resend](https://resend.com) API key (for email delivery)
- A [Stripe](https://stripe.com) account (for credit purchases)

## 1. Clone and install dependencies

```bash
git clone https://github.com/iputuanggak/ai-content-generator-for-social-media.git
cd ai-content-generator-for-social-media
npm install
```

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon connection string (from Neon console → Connection Details) |
| `BETTER_AUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `http://localhost:3000` for local dev |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |
| `OPENROUTER_API_KEY` | From [openrouter.ai/keys](https://openrouter.ai/keys) |
| `RESEND_API_KEY` | From [resend.com/api-keys](https://resend.com/api-keys) |
| `EMAIL_FROM` | Sender email address (e.g., `Lotus <noreply@yourdomain.com>`) |
| `STRIPE_SECRET_KEY` | From [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard → Webhooks (see [Stripe webhook setup](#stripe-webhook-setup)) |
| `STRIPE_PRICE_STARTER` | Stripe Price ID for Starter package (100 credits / $5) |
| `STRIPE_PRICE_GROWTH` | Stripe Price ID for Growth package (500 credits / $20) |
| `STRIPE_PRICE_PRO` | Stripe Price ID for Pro package (2,000 credits / $60) |

## 3. Run database migrations

Push the schema to your Neon database:

```bash
npm run db:push
```

Or generate SQL migrations and apply them:

```bash
npm run db:generate
npm run db:migrate
```

## 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 5. Verify the setup

- Register a user via the sign-up page at `/register`
- Complete email verification (OTP will be logged to console if Resend is not configured)
- Create a team during onboarding — **25 free credits are granted automatically**
- Generate content from the dashboard — each active platform costs 1 credit

## Database Studio

To inspect the database visually:

```bash
npm run db:studio
```

## Running Tests

```bash
npm test
```

Or in watch mode:

```bash
npm run test:watch
```

## Vercel Deployment

Set all environment variables from `.env.example` in your Vercel project settings. The `DATABASE_URL` should point to your production Neon database.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Stripe Webhook Setup

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set the endpoint URL to `https://your-domain.com/api/stripe/webhook`
4. Select the event: **`checkout.session.completed`**
5. Copy the **Signing secret** (starts with `whsec_...`) and set it as `STRIPE_WEBHOOK_SECRET`

### Creating Credit Products in Stripe

For each credit package, create a **one-time product** in Stripe:

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click **Add product**
3. Set the name (e.g., "Starter Credits — 100") and price ($5)
4. Set billing to **One time**
5. Copy the **Price ID** (starts with `price_...`) into the corresponding env variable

| Product Name | Price | Env Variable |
|---|---|---|
| Starter Credits — 100 | $5.00 | `STRIPE_PRICE_STARTER` |
| Growth Credits — 500 | $20.00 | `STRIPE_PRICE_GROWTH` |
| Pro Credits — 2,000 | $60.00 | `STRIPE_PRICE_PRO` |

For local development, use [Stripe CLI](https://docs.stripe.com/stripe-cli) to forward webhook events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
