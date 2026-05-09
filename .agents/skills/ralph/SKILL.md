---
name: ralph
description: Autonomous issue-driven build loop. Reads open GitHub Issues labelled ready-for-agent, picks the next unblocked one, implements it end-to-end using a sub-agent, verifies the build and tests pass, closes the issue, then repeats until no unblocked issues remain. Use when user says "ralph loop", "start building", "implement all issues", "run ralph", or invokes /ralph.
---

# Skill: Ralph Loop

Autonomous loop that implements GitHub Issues one at a time in dependency order.

## Quick start

1. Load this skill
2. Run the loop (see Workflow below)
3. Stay in the session — you are the supervisor; sub-agents do the implementation

## Workflow

### Step 1 — Read context

Before the first iteration, read:
- `CONTEXT.md` — domain glossary and architecture decisions
- `docs/adr/` — any architectural decisions already recorded

### Step 2 — Pick the next issue

```
gh issue list --repo iputuanggak/ai-content-generator-for-social-media \
  --label ready-for-agent --state open --json number,title,body
```

Parse each issue's "Blocked by" section. An issue is **unblocked** when every issue it references is closed. Pick the lowest-numbered unblocked issue.

If no unblocked issues exist → stop and report to the user.

### Step 3 — Implement with a sub-agent

Spawn a `general` sub-agent with this prompt (fill in the blanks):

```
You are implementing GitHub Issue #<N>: "<title>" on the repo
iputuanggak/ai-content-generator-for-social-media.

Context:
- Read CONTEXT.md before writing any code.
- Tech stack: Next.js 16 (Pages Router), TypeScript, Tailwind v4,
  shadcn/ui, Better Auth, Drizzle ORM, Neon (serverless Postgres),
  OpenRouter (default model: google/gemini-2.5-flash), Vercel.
- All API routes go in pages/api/. No App Router, no server actions.
- Read the Next.js guide in node_modules/next/dist/docs/ before
  writing any Next.js code.

Issue body:
<full issue body>

Instructions:
1. Implement everything described in "What to build".
2. Every acceptance criterion must be met before you finish.
3. Run `npm run build` — fix all errors before finishing.
4. If the issue mentions tests or the acceptance criteria include
   testing requirements, load the `tdd` skill and use the
   red-green-refactor loop to write tests before implementation.
5. If the build or tests fail and the root cause is not immediately
   obvious, load the `diagnose` skill to work through the failure
   systematically before attempting a fix.
6. If you need to understand how existing code fits together before
   writing new code, load the `zoom-out` skill to get a broader
   picture of the relevant area.
7. Do NOT close the issue — the supervisor will do that.
8. Return a summary: what you built, what commands to verify it,
   and any decisions you made that weren't in the issue.
```

### Step 4 — Verify

After the sub-agent finishes:

```
npm run build
```

If the build fails, spawn another sub-agent to fix it before proceeding.

If the issue requires tests, run:
```
npm test
```

### Step 5 — Close the issue

```
gh issue close <N> --repo iputuanggak/ai-content-generator-for-social-media \
  --comment "Implemented and verified. Build passes."
```

### Step 6 — Loop

Go back to Step 2.

## Rules

- **One issue at a time.** Never start the next issue until the current one is closed.
- **Never implement on a blocked issue.** Always check blockers first.
- **Supervisor owns git.** Sub-agents write code; the supervisor (you) decides when to commit.
- **Stop on ambiguity.** If an issue says something contradicts `CONTEXT.md` or an ADR, stop and ask the user before proceeding.
- **Don't modify the PRD issue** (#1 in this repo). It is the parent; leave it open.

## Skill invocation map

| Situation | Skill to load |
|---|---|
| Issue has testing requirements in acceptance criteria | `tdd` |
| Build or tests fail with non-obvious root cause | `diagnose` |
| Sub-agent needs to understand existing code before writing new code | `zoom-out` |
| Issue turns out ambiguous or contradicts `CONTEXT.md` | `triage` (supervisor moves issue to `needs-info`, asks user) |
