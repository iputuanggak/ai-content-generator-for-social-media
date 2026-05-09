# AI Content Generator for Social Media

A fullstack web application that allows marketing teams to generate platform-adapted social media content from a single prompt.

## Tech Stack

- **Framework**: Next.js 16 (Pages Router), React 19, TypeScript
- **Auth**: Better Auth with organization plugin
- **Database**: Neon (serverless Postgres)
- **ORM**: Drizzle ORM
- **AI Provider**: OpenRouter (default model: `google/gemini-2.5-flash`)
- **Deployment**: Vercel

## Local Development Setup

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) account (free tier works)
- An [OpenRouter](https://openrouter.ai) API key

### 1. Clone and install dependencies

```bash
git clone https://github.com/iputuanggak/ai-content-generator-for-social-media.git
cd ai-content-generator-for-social-media
npm install
```

### 2. Configure environment variables

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

### 3. Run database migrations

Push the schema to your Neon database:

```bash
npm run db:push
```

Or generate SQL migrations and apply them:

```bash
npm run db:generate
npm run db:migrate
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 5. Verify the setup

- Visit `http://localhost:3000/api/hello` — should return `{"name":"John Doe"}`
- Register a user via the Better Auth API: `POST /api/auth/sign-up/email`
- Check `http://localhost:3000/api/session` after signing in to confirm session persistence

### Database Studio

To inspect the database visually:

```bash
npm run db:studio
```

## Vercel Deployment

Set all environment variables from `.env.example` in your Vercel project settings. The `DATABASE_URL` should point to your production Neon database.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
