# Setup Guidelines

## Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) account (free tier works)
- An [OpenRouter](https://openrouter.ai) API key
- A [Resend](https://resend.com) API key (for email delivery)

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
- Create a team during onboarding
- Generate content from the dashboard

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
