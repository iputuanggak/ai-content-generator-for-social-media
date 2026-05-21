# Lotus

**AI-Powered Social Media Content Generator for Marketing Teams**

A fullstack SaaS application that generates platform-adapted social media content from a single prompt. Marketing teams enter a topic, select a tone, and Lotus produces tailored posts for 8 platforms simultaneously — each optimized for that platform's format, character limits, and audience conventions.

**[Live Demo →](#)** *(coming soon)*

![Lotus Dashboard](#) *(screenshot coming soon)*

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

### Product Pages

- **Marketing landing page** — hero section, feature showcase, testimonials, FAQ, and CTA
- **Onboarding flow** — first-time team creation after registration
- **Responsive design** — sidebar layout on desktop, drawer on mobile

![Landing Page](#) *(screenshot coming soon)*

---

## Architecture Highlights

- **SSE streaming for AI generation** — each platform's result streams to the client independently via `text/event-stream`, enabling progressive rendering
- **Slug-based multi-tenancy** — team scoping via URL slugs with membership verification at the API layer
- **Custom OTP auth flow** — purpose-built email verification with attempt tracking, cooldown, and expiry (see [`docs/adr/`](docs/adr/))
- **Dependency injection for testability** — services accept `fetchFn` and `db` as parameters, enabling 55+ test files with mocked external dependencies
- **Concurrent AI calls** — all active platforms generate in parallel via `Promise.all`, with results streamed as they resolve

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16 (Pages Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, shadcn/ui (radix-nova), HugeIcons, Motion (Framer Motion) |
| **Auth** | Better Auth with organization plugin — custom OTP flow on top |
| **Database** | Neon (serverless Postgres) |
| **ORM** | Drizzle ORM |
| **AI Provider** | OpenRouter — Google Gemini, OpenAI GPT-4.1, Anthropic Claude (model configurable per team) |
| **Email** | Resend + React Email (OTP codes, team invitations) |
| **State Management** | TanStack Query v5 with localStorage persistence |
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

## Getting Started

See [SETUP-GUIDELINES.md](SETUP-GUIDELINES.md) for local development setup, environment variables, database migrations, and deployment instructions.

## License

MIT
