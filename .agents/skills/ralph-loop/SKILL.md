---
name: ralph-loop
description: Autonomous issue-driven build loop. Reads open GitHub Issues labelled ready-for-agent, picks the next unblocked one, implements it end-to-end using a sub-agent, verifies the build and tests pass, commits and pushes, closes the issue, then repeats until no unblocked issues remain. Use when user says "ralph loop", "start building", "implement all issues", "run ralph", or invokes /ralph.
---

# Skill: Ralph Loop

Autonomous loop that implements GitHub Issues in dependency order, one issue at a time.

## Quick start

**Prerequisites:**
1. `gh auth status` — must show an authenticated account
2. `git status` — working tree must be clean
3. You are on the branch you want to build from

**Then run the loop:**
1. Capture `<base-branch>`: `git rev-parse --abbrev-ref HEAD`
2. Capture `<repo>`: `gh repo view --json nameWithOwner -q .nameWithOwner`
3. Set `<iterations> = 0` and `<closed-this-session> = []`
4. Read `CONTEXT.md` and `docs/adr/`
5. Repeat Steps 1–7 in [REFERENCE.md](REFERENCE.md) until no unblocked issues remain

---

## Rules

- **Sequential.** One issue at a time. Never start the next until current is closed.
- **Supervisor owns git.** Sub-agents write code only — never run git themselves.
- **Halt on stuck.** If sub-agent returns `status: stuck` or unparseable response → discard partial work (`git checkout .` + `git clean -fd`), halt and report issue number, title, blocker, and resume instructions.
- **Validate commit fields.** Never use unvalidated `commitType`/`commitScope` from sub-agent directly.
- **Stop on ambiguity.** If issue contradicts `CONTEXT.md` or an ADR → relabel `needs-info`, comment reason, halt.
- **Skip parent issues.** Issues labelled `prd` or `epic` are read-only context (passed to sub-agents but never implemented).
- **Iteration limit.** Halt if `<iterations>` exceeds `50`.

---

## Commit types

| Type | When |
|---|---|
| `feat` | New feature or user-facing capability |
| `fix` | Bug fix |
| `refactor` | Restructuring with no behavior change |
| `chore` | Config, tooling, dependencies |
| `docs` | Documentation only |
| `test` | Tests only |
| `perf` | Performance improvement |

## Skill invocation map

| Situation | Load skill |
|---|---|
| Non-trivial `feat`, `fix`, `refactor`, `test`, `perf` issue | `tdd` |
| Trivial changes (CSS, renames, config) | skip `tdd` |
| `chore` or `docs` issue | skip `tdd` |
| Non-obvious build/test failure | `diagnose` |
| Before writing any code | `zoom-out` |

See [REFERENCE.md](REFERENCE.md) for detailed step-by-step instructions and [EXAMPLES.md](EXAMPLES.md) for sub-agent prompt templates.
