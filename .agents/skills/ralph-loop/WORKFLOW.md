# Ralph Loop — Workflow

Detailed step-by-step instructions for the ralph loop. The supervisor follows these steps; sub-agents only implement code.

---

## Step 2 — Pick next issue

```bash
git status --porcelain
```
If any output → halt: `Ralph halted: working tree is dirty.`

```bash
gh issue list --repo <repo> --label ready-for-agent --state open --json number,title,body,labels
```

Parse "Blocked by" in each body. An issue is **unblocked** when every referenced issue is closed.

**Skip with warning** any issue that also carries: `needs-triage`, `needs-info`, `wontfix`, `prd`, `epic`.

Fetch full detail for each unblocked candidate:
```bash
gh issue view <N> --repo <repo> --json number,title,labels,body
```

- No unblocked issues → stop and report.
- Pick the **lowest-numbered** unblocked issue → go to Step 3.

---

## Step 3 — Implement with sub-agent

Spawn a `general` sub-agent using the prompt in [SUBAGENT-PROMPT.md](SUBAGENT-PROMPT.md), filling in `<N>`, `<title>`, `<repo>`, `<full issue body>`, and `<absolute path to repo root>`.

---

## Step 4 — Verify

**4-a. Validate response:**
- Missing `status`/`summary`, or empty → treat as `status: stuck`.
- `status == "stuck"` → halt:
  ```
  Ralph loop halted on issue #<N>: "<title>"
  Blocker: <blockers field>

  To resume: fix the issue description or remove the `ready-for-agent` label, then re-run ralph.
  ```

**4-b. Lint:**
```bash
npm run lint
```
On failure: spawn one fix sub-agent (prompt: "Fix these lint errors only, do not re-implement: `<output>`").  
Still fails → halt noting lint failure.

**4-c. Tests:**
```bash
node -e "const p = require('./package.json'); process.exit(p.scripts && p.scripts.test ? 0 : 1)"
```
No `test` script → skip (log: `No test script found — skipping.`).  
Exists:
```bash
npm test
```
Same single-retry + halt-on-failure policy.

---

## Step 4b — Commit and push

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

## Step 5 — Close issue

```bash
gh issue close <N> --repo <repo> \
  --comment "Implemented and verified. Committed as: <commit message>"
```

---

## Step 6 — Loop

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

## Ambiguity halt procedure

If an issue contradicts `CONTEXT.md` or an ADR:
```bash
gh issue edit <N> --repo <repo> --remove-label ready-for-agent --add-label needs-info
gh issue comment <N> --repo <repo> --body "Halted by ralph: <reason>"
```
Report to user and stop.
