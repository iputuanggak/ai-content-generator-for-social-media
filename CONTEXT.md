# Context: AI Content Generator for Social Media

## Purpose

A fullstack web application that allows **marketing teams** to generate platform-adapted social media content from a single prompt. Content is generated for multiple platforms simultaneously, with each output adapted to that platform's tone, format, and constraints. Users record an intended publish date/time per generation for scheduling reference — no direct publishing to social media APIs.

---

## Glossary

### Team
An organization unit in the system. Users belong to a Team. A Team has shared brand settings (brand voice, default tone, active platforms) that influence every content generation. Managed via Better Auth's organization plugin.

### Member
A user who belongs to a Team. Members share the Team's generation history and brand settings.

### Brand Settings
Team-level configuration that is injected into every generation prompt. Consists of:
- **Brand Voice** — a text description of the team's tone and personality
- **Default Tone** — the pre-selected tone applied unless overridden per generation
- **Active Platforms** — which social media platforms are enabled for this team

### Generation
A single content generation event. A Generation record contains:
- **Input** — the topic and tone provided by the user
- **Intended Publish Date** — the date/time the team plans to publish (informational only, no API publishing)
- **Platform Outputs** — one generated post per active platform, adapted for that platform's constraints
- **User Edits** — edits made by the user to any platform output after generation

### Platform Output
A single generated post for one social media platform within a Generation. Adapted from the same core message to fit that platform's character limits, tone norms, and format conventions.

### Tone
A user-selectable style modifier applied to content generation. Options: Professional, Casual, Humorous, Inspirational.

### Active Platforms
The subset of supported platforms enabled for a Team. Only Active Platforms appear in generation results.

### Supported Platforms
The full set of social media platforms the system can generate content for:
- Twitter/X
- LinkedIn
- Instagram
- Facebook
- TikTok
- YouTube (description)
- Threads
- Pinterest

### Email Verification
A process that confirms a user's email address is real and accessible. Required after registration and after any email address change. Unverified users are blocked from accessing any protected routes until they complete verification.

### OTP (One-Time Password)
A 6-digit numeric code sent to a user's email for verification purposes. Valid for 5 minutes. Maximum 5 attempts per code before it is invalidated. Can be resent after a 60-second cooldown. Used for multiple purposes: email verification, password reset, and other confirmation flows. Stored in the `emailOtp` database table with a `purpose` enum to distinguish use cases.

### Disposable Email
A temporary email address from services like Mailinator or Guerrilla Mail, designed to be thrown away. Blocked at registration and email change to prevent spam accounts. Enforced via a static blocklist of known disposable email domains, checked on both client-side and server-side.

### Email Service
The system responsible for sending transactional emails (OTP codes). Powered by Resend with React Email templates. Sender address is configurable via the `EMAIL_FROM` environment variable.

---

## Architecture

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (Pages Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui (radix-nova), HugeIcons |
| Auth | Better Auth with organization plugin — all user/session/org data stored in Neon |
| Database | Neon (serverless Postgres) |
| ORM | Drizzle ORM |
| AI Provider | OpenRouter — default model `google/gemini-2.5-flash`, model is configurable per Team |
| Deployment | Vercel |

---

## Key Constraints

- **No social media API publishing.** The app generates and stores content only. Intended publish date is a metadata field, not a scheduling trigger.
- **All data in Neon.** No auth data is stored in third-party managed auth infrastructure. Better Auth owns the full user/org schema in the project's Neon database.
- **Model-switchable.** OpenRouter is used as the AI provider so the default model (`google/gemini-2.5-flash`) can be swapped per Team without changing application code.
- **Platform adaptation, not independent generation.** All platform outputs share the same core message — the AI adapts formatting, length, tone, and conventions per platform rather than generating independent angles.
