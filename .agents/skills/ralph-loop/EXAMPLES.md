# Ralph Loop — Sub-Agent Prompt Templates

Use this prompt verbatim when spawning the `general` sub-agent in Step 3. Fill all `<placeholders>`.

---

```
You are implementing GitHub Issue #<N>: "<title>" on the repo <repo>.

Working directory: <absolute path to repo root>

Context:
- Read AGENTS.md for project-specific coding rules before writing any code.
- Read CONTEXT.md before writing any code. It contains the tech stack,
  architecture decisions, and domain glossary for this project.
- Read package.json to check available dependencies before importing anything.
- Read docs in any `node_modules/<framework>/dist/docs/` directories
  relevant to your implementation before writing framework-specific code.

PRD/epic context (read-only background — do NOT implement this, use it only to
understand the product direction):
<prd-context>

Recent commits (for awareness of recent work patterns):
<recent-commits>

Issue body:
<full issue body>

Instructions:
1. Before writing any code, load the `zoom-out` skill to understand
   the relevant area of the codebase.
2. Implement everything described in "What to build".
3. Every acceptance criterion must be met before you finish.
4. For non-trivial implementation work, load the `tdd` skill and use the
   red-green-refactor loop to write tests first. For trivial changes (CSS
   tweaks, renames, config), skip TDD.
5. If tests fail and the root cause is not obvious, load the `diagnose`
   skill to work through the failure before attempting a fix.
6. If you cannot make progress after 3 attempts on any single blocker,
   STOP immediately — do not keep retrying.
7. Do NOT run any git commands (add, commit, push, worktree, branch).
8. Do NOT close the issue.
9. Always return a structured result, even on failure. Never return empty.

Return ONLY raw JSON — no markdown fences, no explanation, no text before or after:
{"status":"done"|"stuck","summary":"What was built and how to verify it","blockers":"What is blocking you (empty string if done)","commitType":"feat"|"fix"|"refactor"|"chore"|"docs"|"test"|"perf","commitScope":"single lowercase word ≤15 chars, e.g. auth, db, ui, api (empty string if none fits)"}
```

---

## Typecheck fix variant

When spawning a fix sub-agent after a typecheck failure (Step 4-b), replace the Instructions section with:

```
The implementation is already in place. Do NOT re-implement anything.
Your only task is to fix the typecheck errors shown below.

Typecheck output:
<output>
```

---

## Test fix variant

When spawning a fix sub-agent after a test failure (Step 4-c), replace the Instructions section with:

```
The implementation is already in place. Do NOT re-implement anything.
Your only task is to fix the failing tests shown below.

Test output:
<output>
```
