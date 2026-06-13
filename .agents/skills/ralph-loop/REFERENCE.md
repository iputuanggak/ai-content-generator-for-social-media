# Ralph Loop — Workflow

Detailed step-by-step instructions for the ralph loop. The supervisor follows these steps; sub-agents only implement code.

---

## Step 1 — Sync

```bash
git pull --ff-only
```

Fails → halt: `Ralph halted: local branch is behind remote. Resolve and re-run.`

---

## Step 2 — Pick next issue

```bash
git status --porcelain
```
If any output and this is the first iteration → halt: `Ralph halted: working tree is dirty.`
If any output and this is a subsequent iteration (resuming after a stuck halt) → warn: `Working tree has partial changes from previous stuck issue. Resolve the working tree before proceeding.` then halt.

```bash
gh issue list --repo <repo> --label ready-for-agent --state open --json number,title,body,labels
```

Parse "Blocked by" in each body. An issue is **unblocked** when every referenced issue is closed.

**Skip with warning** any issue that also carries: `needs-triage`, `needs-info`, `wontfix`.

**Recent commits context:**

```bash
git log --oneline -10
```

Store the output as `<recent-commits>`. This gives sub-agents awareness of recent work.

Fetch full detail for each unblocked candidate:
```bash
gh issue view <N> --repo <repo> --json number,title,labels,body
```

- No unblocked issues → go to **Done**.
- Pick the **lowest-numbered** unblocked issue → go to Step 3.

---

## Step 3 — Implement with sub-agent

**Fetch PRD context:** Parse the issue body for references to PRD/epic issues (e.g., "Part of #5", "PRD #3", "Parent: #7"). For each referenced PRD/epic number, fetch:

```bash
gh issue view <prd-number> --repo <repo> --json number,title,body
```

Store fetched PRD bodies as `<prd-context>`. If the issue references no PRDs, `<prd-context>` is empty.

Spawn a `general` sub-agent using the prompt in [EXAMPLES.md](EXAMPLES.md), filling in `<N>`, `<title>`, `<repo>`, `<full issue body>`, `<prd-context>`, `<recent-commits>`, and `<absolute path to repo root>`.

---

## Step 4 — Verify

**4-a. Parse response:**

The sub-agent may wrap JSON in markdown fences or add surrounding text. Parse robustly:
1. Strip any ``` ``` ``` or ```json ``` fences.
2. Extract the first valid JSON object from the text.
3. Parse required fields: `status`, `summary`, `blockers`, `commitType`, `commitScope`.

If parsing fails completely → treat as `status: stuck`.

If `status == "stuck"` → preserve partial work in the working tree. Gather a diff summary:
```bash
git diff --stat
git diff --stat --cached
```
Then halt:
```
Ralph loop halted on issue #<N>: "<title>"
Blocker: <blockers field>

Partial changes left in working tree:
<diff --stat output>

To resume: fix the issue description or remove the `ready-for-agent` label, then re-run ralph.
```

**4-b. Typecheck:**
```bash
npm run typecheck
```
On failure: spawn one fix sub-agent (prompt from EXAMPLES.md "Typecheck fix variant", passing the typecheck output).
Still fails → preserve partial work in the working tree, then halt noting typecheck failure.

**4-c. Tests:**
```bash
node -e "const p = require('./package.json'); process.exit(p.scripts && p.scripts.test ? 0 : 1)"
```
No `test` script → skip (log: `No test script found — skipping.`).
Exists:
```bash
npm test
```
Same single-retry policy. Still fails → preserve partial work in the working tree, then halt noting test failure.

---

## Step 5 — Commit and push

Validate sub-agent fields:
1. `commitType` must be one of: `feat fix refactor chore docs test perf` — default to `feat` if invalid.
2. `commitScope` must be single lowercase word ≤15 chars — omit if invalid or empty.
3. Build message:
   - With scope: `<commitType>(<commitScope>): #<N> <title>`
   - Without scope: `<commitType>: #<N> <title>`

```bash
git add -A
git commit -m "<message>"
git push
```

---

## Step 6 — Close issue

```bash
gh issue close <N> --repo <repo> \
  --comment "Implemented and verified. Committed as: <commit message>"
```

Record `<N>` in `<closed-this-session>` list.

---

## Step 7 — Loop

Increment `<iterations>`. If > 50 → halt:
```
Ralph halted: maximum iteration limit (50) reached.
Review open ready-for-agent issues for circular dependencies, then re-run ralph.
```

Otherwise:
```bash
git pull --ff-only
```
Go to Step 2.

---

## Done

When no unblocked issues remain, print a session summary:

```
Ralph done. <iterations> issues closed this session: <closed-this-session>.
Remaining: <count> open issues (<blocked> blocked, <other> need triage or not ready).
```

To generate the remaining counts:
```bash
gh issue list --repo <repo> --label ready-for-agent --state open --json number
gh issue list --repo <repo> --state open --json number
```

---

## Ambiguity halt procedure

If an issue contradicts `CONTEXT.md` or an ADR:
```bash
gh issue edit <N> --repo <repo> --remove-label ready-for-agent --add-label needs-info
gh issue comment <N> --repo <repo> --body "Halted by ralph: <reason>"
```
Report to user and stop.
