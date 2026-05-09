---
name: ralph
description: Autonomous issue-driven build loop. Reads open GitHub Issues labelled ready-for-agent, picks the next unblocked one, implements it end-to-end using a sub-agent, verifies the build and tests pass, commits and pushes, closes the issue, then repeats until no unblocked issues remain. Supports parallel execution via git worktree when multiple issues are unblocked. Use when user says "ralph loop", "start building", "implement all issues", "run ralph", or invokes /ralph.
---

# Skill: Ralph Loop

Autonomous loop that implements GitHub Issues in dependency order, with optional parallel execution via git worktree.

## Quick start

**Prerequisites — verify before running:**
1. `gh auth status` — must show an authenticated account
2. Working tree is clean — `git status` shows nothing staged or unstaged
3. You are on the branch you want to build from

**Then:**
1. Load this skill
2. Run the loop (see Workflow below)
3. Stay in the session — you are the supervisor; sub-agents do the implementation and you own all git operations

---

## Workflow

### Step 1 — Read context

Before the first iteration:

```bash
git pull --ff-only
```

**Capture base branch:**

```bash
git rev-parse --abbrev-ref HEAD
```

Store this as `<base-branch>`. Use it everywhere below instead of hardcoded `main`.

**Capture repo slug:**

```bash
gh repo view --json nameWithOwner -q .nameWithOwner
```

Store this as `<repo>`. Use it in all `gh` commands below instead of a hardcoded repo name.

**Initialise iteration counter:** Set `<iterations> = 0`. The loop will halt if `<iterations>` exceeds `50`.

Then read:
- `CONTEXT.md` — domain glossary and architecture decisions
- `docs/adr/` — any architectural decisions already recorded

---

### Step 2 — Build dependency graph and pick unblocked issues

**Check working tree is clean:**
```bash
git status --porcelain
```
If any output is returned, halt immediately:
```
Ralph halted: working tree is dirty.
Stash or commit your local changes before running ralph.
```

Fetch all open `ready-for-agent` issues with full detail:

```bash
gh issue list --repo <repo> \
  --label ready-for-agent --state open --json number,title,body,labels
```

For each issue, parse the "Blocked by" section. An issue is **unblocked** when every issue it references is closed.

**Skip any issue that also carries any of these labels:** `needs-triage`, `needs-info`, `wontfix`. Warn the user:
```
Skipping issue #<N> "<title>": has ready-for-agent but also carries <label> — resolve it first.
```

**Skip any issue labelled `prd` or `epic`** (parent tracking issues intentionally left open). Warn the user:
```
Skipping issue #<N> "<title>": labelled as a parent issue (prd/epic) — always left open.
```

Then fetch each unblocked issue's full detail:

```bash
gh issue view <N> --repo <repo> \
  --json number,title,labels,body
```

**If no unblocked issues exist** → stop and report to the user.

**If exactly 1 unblocked issue** → proceed to Step 3 (sequential).

**If ≥2 unblocked issues** → list them to the user:
```
The following issues are currently unblocked:
  #<N1> <title1>
  #<N2> <title2>
  ...

Run in parallel (git worktree) or sequentially?
WARNING: parallel mode may hit merge conflicts — the loop will halt and ask for
manual resolution if a rebase conflict occurs.
```
Wait for the user's answer before proceeding.
- User chooses **sequential** → proceed to Step 3 with the lowest-numbered unblocked issue.
- User chooses **parallel** → proceed to Step 3P (parallel branch).

---

### Step 3 — Implement with a sub-agent (sequential)

Spawn a `general` sub-agent with this prompt (fill in `<N>`, `<title>`, `<full issue body>`):

```
You are implementing GitHub Issue #<N>: "<title>" on the repo
<repo>.

Working directory: <absolute path to repo root>

Context:
- Read CONTEXT.md before writing any code. It contains the tech stack,
  architecture decisions, and domain glossary for this project.
- Read the docs in any `node_modules/<framework>/dist/docs/` directories
  relevant to your implementation before writing framework-specific code.

Issue body:
<full issue body>

Instructions:
1. Before writing any code, load the `zoom-out` skill to understand
   the relevant area of the codebase.
2. Implement everything described in "What to build".
3. Every acceptance criterion must be met before you finish.
4. Unless the issue is purely `chore` or `docs` type, always load
   the `tdd` skill and use the red-green-refactor loop to write
   tests before implementation.
5. If tests fail and the root cause is not immediately obvious, load
   the `diagnose` skill to work through the failure systematically
   before attempting a fix.
6. If you cannot make progress after 3 attempts on any single blocker,
   STOP immediately — do not keep retrying.
7. Do NOT run any git commands (add, commit, push, worktree, branch).
   The supervisor owns all git operations.
8. Do NOT close the issue — the supervisor will do that.
9. You MUST always return a structured result, even on failure.
   Never return an empty response.

Return EXACTLY this JSON structure (no extra text outside the JSON):
{
  "status": "done" | "stuck",
  "summary": "What was built and how to verify it",
  "blockers": "Describe what is blocking you (empty string if status is done)",
  "commitType": "feat" | "fix" | "refactor" | "chore" | "docs" | "test" | "perf",
  "commitScope": "single lowercase word max 15 chars, e.g. auth, db, ui, api, content (empty string if none fits)"
}
```

---

### Step 3P — Implement with parallel sub-agents (git worktree)

For each unblocked issue `<N>`:

**3P-a. Clean up any stale branch and create a worktree:**
```bash
# Remove stale branch if it exists
git branch --list "issue-<N>" | grep -q . && git branch -D "issue-<N>"
# Create worktree branching off <base-branch>
git worktree add ../worktree-<N> -b issue-<N> <base-branch>
```

**3P-b. Spawn one `general` sub-agent per worktree** with this prompt (fill in `<N>`, `<title>`, `<full issue body>`, `<absolute worktree path>`):

```
You are implementing GitHub Issue #<N>: "<title>" on the repo
<repo>.

Working directory: <absolute path to ../worktree-<N>>

IMPORTANT: All file edits, reads, and shell commands (including npm run build)
MUST operate inside the working directory above. Do NOT touch the main repo directory.

Context:
- Read CONTEXT.md (inside your working directory) before writing any code.
  It contains the tech stack, architecture decisions, and domain glossary
  for this project.
- Read the docs in any `node_modules/<framework>/dist/docs/` directories
  relevant to your implementation before writing framework-specific code.

Issue body:
<full issue body>

Instructions:
1. Before writing any code, load the `zoom-out` skill to understand
   the relevant area of the codebase.
2. Implement everything described in "What to build".
3. Every acceptance criterion must be met before you finish.
4. Unless the issue is purely `chore` or `docs` type, always load
   the `tdd` skill and use the red-green-refactor loop to write
   tests before implementation.
5. If tests fail and the root cause is not immediately obvious, load
   the `diagnose` skill to work through the failure systematically
   before attempting a fix.
6. If you cannot make progress after 3 attempts on any single blocker,
   STOP immediately — do not keep retrying.
7. Do NOT run any git commands (add, commit, push, worktree, branch).
   The supervisor owns all git operations.
8. Do NOT close the issue — the supervisor will do that.
9. You MUST always return a structured result, even on failure.
   Never return an empty response.

Return EXACTLY this JSON structure (no extra text outside the JSON):
{
  "status": "done" | "stuck",
  "summary": "What was built and how to verify it",
  "blockers": "Describe what is blocking you (empty string if status is done)",
  "commitType": "feat" | "fix" | "refactor" | "chore" | "docs" | "test" | "perf",
  "commitScope": "single lowercase word max 15 chars, e.g. auth, db, ui, api, content (empty string if none fits)"
}
```

**3P-c. Wait for ALL sub-agents to finish** before proceeding to Step 4P.

---

### Step 4 — Verify (sequential)

After the sub-agent returns:

**4-a. Validate the response:**
- If the response is missing `status` or `summary`, or is empty → treat as `status: stuck`.
- If `status == "stuck"` → **halt the loop**. Report to the user:
  ```
  Ralph loop halted on issue #<N>: "<title>"
  Blocker: <blockers field>
  
  To resume: fix the issue description or remove the `ready-for-agent` label
  to skip it, then re-run ralph.
  ```
  Stop here. Do not proceed.

**4-b. Run lint:**
```bash
npm run lint
```
If lint fails:
- Spawn one fix sub-agent (same prompt as Step 3, but replace the Instructions section with: "The implementation is already in place. Do NOT re-implement anything. Your only task is to fix the lint errors shown below. Here is the lint output: `<output>`").
- If lint still fails after one fix attempt → **halt the loop** noting lint failure as the blocker.

**4-c. Run tests (if required by the issue):**

First check whether a `test` script exists:
```bash
node -e "const p = require('./package.json'); process.exit(p.scripts && p.scripts.test ? 0 : 1)"
```
If no `test` script exists → skip this step and log: `No test script found in package.json — skipping test run.`

If it exists:
```bash
npm test
```
Same single-retry + halt-on-failure policy as build.

---

### Step 4P — Verify (parallel)

For each worktree in sequence:

**4P-a. Validate the sub-agent response** using the same rules as Step 4-a.
If any sub-agent returned `status: stuck` or an invalid response:
- Clean up ALL worktrees:
  ```bash
  git worktree remove ../worktree-<N> --force
  git branch -D issue-<N>
  ```
  (repeat for each worktree)
- Halt the loop with the halt message. Stop here.

---

### Step 4b — Commit and push

**Validate and build the commit message:**

1. Check `commitType` is one of: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`.
   If not → default to `feat`.
2. Check `commitScope`: must be a single lowercase word, ≤15 chars, no spaces.
   If invalid or empty → omit scope entirely.
3. Build message:
   - With scope: `<commitType>(<commitScope>): #<N> <title>`
   - Without scope: `<commitType>: #<N> <title>`

**For sequential mode:**
```bash
git add -A
git commit -m "<commitType>(<commitScope>): #<N> <title>"
git push
```

**For parallel mode** — for each issue branch in sequence:
```bash
# Stage and commit inside worktree
git -C ../worktree-<N> add -A
git -C ../worktree-<N> commit -m "<commitType>(<commitScope>): #<N> <title>"

# Merge into <base-branch> (fast-forward only)
git checkout <base-branch>
git merge --ff-only issue-<N>
# If merge fails → halt immediately:
#   "Cannot fast-forward <base-branch> onto issue-<N>.
#    Rebase the branch manually: git checkout issue-<N> && git rebase <base-branch>
#    Then re-run ralph to continue."
# Clean up all remaining worktrees before halting.

git push

# Clean up
git worktree remove ../worktree-<N>
git branch -D issue-<N>
```

---

### Step 5 — Close the issue

```bash
gh issue close <N> --repo <repo> \
  --comment "Implemented and verified. Committed as: <commit message>"
```

For parallel mode, close each issue after its branch is merged.

---

### Step 6 — Loop

Increment `<iterations>` by 1. If `<iterations>` exceeds `50`, halt:
```
Ralph halted: maximum iteration limit (50) reached.
This may indicate a circular dependency in your issues or a runaway loop.
Review the open ready-for-agent issues and re-run ralph when resolved.
```

Otherwise run `git pull --ff-only`, then go back to Step 2.

---

## Rules

- **One issue at a time (sequential).** Never start the next issue until the current one is closed.
- **Never implement a blocked issue.** Always check blockers first.
- **Supervisor owns git.** Sub-agents write code only. The supervisor runs all git commands: add, commit, push, worktree, branch, rebase.
- **Sub-agents must never run git commands.** If a sub-agent's response mentions running git, ignore that and run it yourself.
- **Halt on stuck.** If a sub-agent returns `status: stuck`, or returns an empty/malformed response → halt the loop and report to the user. Do not skip and continue.
- **Halt message must include:** issue number, title, blocker description, and instructions for the user to resume (`fix the issue description` or `remove the ready-for-agent label`).
- **Validate commit fields.** Always validate `commitType` and `commitScope` before building the commit message. Never use an unvalidated value from the sub-agent directly.
- **Clean up worktrees on halt.** If ralph halts during parallel mode, remove all open worktrees and branches before stopping.
- **Merge must be fast-forward.** Use `git merge --ff-only`. If fast-forward is not possible, halt and instruct the user to rebase the branch manually onto main before re-running ralph.
- **Stop on ambiguity.** If an issue contradicts `CONTEXT.md` or an ADR → relabel it and halt:
  ```bash
  gh issue edit <N> --repo <repo> \
    --remove-label ready-for-agent --add-label needs-info
  gh issue comment <N> --repo <repo> \
    --body "Halted by ralph: <reason for ambiguity>"
  ```
  Then report to the user and stop. Do not proceed.
- **Don't implement parent issues.** Issues labelled `prd` or `epic` are tracking parents — leave them open. Skip them in Step 2.

---

## Commit type reference

| Type | When to use |
|---|---|
| `feat` | New feature or user-facing capability |
| `fix` | Bug fix |
| `refactor` | Code restructuring with no behavior change |
| `chore` | Config, tooling, dependencies, scaffolding |
| `docs` | Documentation only |
| `test` | Tests only |
| `perf` | Performance improvement |

---

## Skill invocation map

| Situation | Skill to load |
|---|---|
| Issue is `feat`, `fix`, `refactor`, `test`, or `perf` type | `tdd` (always) |
| Issue is `chore` or `docs` type | skip `tdd` |
| Build or tests fail with non-obvious root cause | `diagnose` |
| Before writing any code | `zoom-out` (always) |
| Issue turns out ambiguous or contradicts `CONTEXT.md` | supervisor relabels to `needs-info`, comments reason, halts (see Rules) |
