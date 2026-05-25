# Lotus

**AI-Powered Social Media Content Generator for Marketing Teams**

A fullstack SaaS application that generates platform-adapted social media content from a single prompt. Marketing teams enter a topic, select a tone, and Lotus produces tailored posts for 8 platforms simultaneously — each optimized for that platform's format, character limits, and audience conventions.

**[Live Demo →](https://lotus.putuangga.com/)**

![Lotus Dashboard](/public/images/ai%20content%20generator%20dashboard.avif) 

---

## Features

### Content Generation

- **Multi-platform generation** — produces posts for Twitter/X, LinkedIn, Instagram, Facebook, TikTok, YouTube, Threads, and Pinterest from a single topic
- **Real-time streaming** — results stream back via Server-Sent Events as each platform completes, not all-at-once
- **Tone control** — choose from Professional, Casual, Humorous, or Inspirational
- **Per-platform editing** — edit, copy, or regenerate individual platform outputs without affecting others
- **Generation history** — paginated history with search and date filtering

### Team Collaboration

- **Organization-based teams** — create a team, invite members via email, manage roles (Owner, Admin, Member)
- **Shared brand settings** — team-level brand voice, default tone, active platforms, and AI model selection
- **Slug-based workspaces** — each team gets a URL-friendly slug (e.g., `/acme-corp`)

### Authentication & Security

- **Email verification** via 6-digit OTP with rate limiting, cooldown, and expiry
- **Disposable email blocking** — prevents spam registrations with a domain blocklist
- **Role-based access** — admin-only actions for settings, member management, and invitations

### Blog (Strapi CMS)

- **Headless CMS** — blog powered by Strapi v5 with Articles and Categories content types
- **ISR with 60s revalidation** — statically generated listing and detail pages, revalidated incrementally
- **Client-side pagination** — "Load more" via a Next.js API route that proxies to Strapi
- **Rich text rendering** — full Blocks editor support (paragraphs, headings, lists, quotes, code, images, inline formatting, links)
- **Public access** — blog pages are excluded from auth middleware
- **Category filtering** — filter articles by category with tab navigation

### AI Credit System

- **Pay-per-use credits** — 1 credit = 1 platform output (generating across 5 platforms costs 5 credits)
- **25 free starter credits** — automatically granted when a team is created
- **FIFO consumption** — oldest credits are used first across batches
- **12-month expiry** — unused credits expire 12 months from the batch creation date
- **Per-platform cost transparency** — the generation UI shows the exact credit cost before each run
- **Low-credit warning** — a dismissible banner appears when the balance drops below 10 credits
- **Transaction history** — full audit trail with balance-before/balance-after for every event (top-ups, generations, regenerations, batch expirations)

### Billing & Payments (Stripe)

- **One-time payments** via Stripe Checkout (not subscriptions) — users buy credit packages as needed
- **Stripe Checkout Sessions** — server-side session creation with team metadata for reconciliation
- **Webhook handling** — `checkout.session.completed` events processed with signature verification and idempotency checks
- **Environment-mapped pricing** — Stripe Price IDs are configured via environment variables, allowing easy switching between test/live modes
- **Success/cancel redirects** — users are redirected back to the Credits page with feedback toasts

### Product Pages

- **Marketing landing page** — hero section, feature showcase, testimonials, FAQ, and CTA
- **Onboarding flow** — first-time team creation after registration
- **Responsive design** — sidebar layout on desktop, drawer on mobile

---

## Architecture Highlights

- **SSE streaming for AI generation** — each platform's result streams to the client independently via `text/event-stream`, enabling progressive rendering
- **Slug-based multi-tenancy** — team scoping via URL slugs with membership verification at the API layer
- **Custom OTP auth flow** — purpose-built email verification with attempt tracking, cooldown, and expiry
- **Dependency injection for testability** — services accept `fetchFn` and `db` as parameters, enabling 55+ test files with mocked external dependencies
- **Concurrent AI calls** — all active platforms generate in parallel via `Promise.all`, with results streamed as they resolve
- **Strapi v5 headless CMS integration** — hand-rolled REST client with typed content models, ISR revalidation, and a custom Blocks renderer for rich content
- **Credit-based usage with Stripe billing** — per-platform credit deduction with FIFO batch consumption, 12-month expiry, running-balance audit ledger, and Stripe Checkout for one-time top-ups

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16 (Pages Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, shadcn/ui (radix-nova), HugeIcons, Motion (Framer Motion) |
| **CMS** | Strapi v5 (Headless CMS) — blog articles and categories |
| **Auth** | Better Auth with organization plugin — custom OTP flow on top |
| **Database** | Neon (serverless Postgres) |
| **ORM** | Drizzle ORM (PostgreSQL) |
| **AI Provider** | OpenRouter — Google Gemini, OpenAI GPT-4.1, Anthropic Claude (model configurable per team) |
| **Email** | Resend + React Email (OTP codes, team invitations) |
| **Payments** | Stripe (Checkout Sessions, Webhooks) |
| **State Management** | TanStack Query v5 (known as React Query) with localStorage persistence |
| **Notifications** | Sonner |
| **Testing** | Vitest + Testing Library + jsdom |
| **Deployment** | Vercel |

---

## Supported AI Models

| Provider | Model |
|---|---|
| Google | Gemini 2.5 Flash *(default)*, Gemini 2.0 Flash |
| OpenAI | GPT-4.1 Mini, GPT-4.1 Nano |
| Anthropic | Claude 3.5 Haiku, Claude 3 Haiku |

Teams can switch models from Brand Settings without any code changes.

---

## Credit Pricing

| Package | Credits | Price | Per-Credit Cost |
|---------|---------|-------|-----------------|
| **Starter** | 100 | $5 | $0.050 |
| **Growth** | 500 | $20 | $0.040 |
| **Pro** | 2,000 | $60 | $0.030 |

All teams start with 25 free credits. Credits expire 12 months from the batch creation date.

---

## Getting Started

See [SETUP-GUIDELINES.md](SETUP-GUIDELINES.md) for local development setup, environment variables, database migrations, and deployment instructions.

### Blog Environment Variables

| Variable | Description |
|---|---|
| `STRAPI_URL` | Base URL of the Strapi v5 instance (server-side). Default: `http://localhost:1337` |
| `STRAPI_API_TOKEN` | Read-only API token for Strapi authentication (server-side) |
| `NEXT_PUBLIC_STRAPI_URL` | Public URL for resolving cover image paths in the browser |

### Stripe & Credit System Environment Variables

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe API secret key (server-side) |
| `STRIPE_WEBHOOK_SECRET` | Webhook endpoint signing secret for signature verification |
| `STRIPE_PRICE_STARTER` | Stripe Price ID for the Starter package (100 credits) |
| `STRIPE_PRICE_GROWTH` | Stripe Price ID for the Growth package (500 credits) |
| `STRIPE_PRICE_PRO` | Stripe Price ID for the Pro package (2,000 credits) |

## License

MIT
