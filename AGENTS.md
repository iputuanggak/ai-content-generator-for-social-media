<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

GitHub Issues (`iputuanggak/ai-content-generator-for-social-media`). Uses `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout. `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.

### Skills

- **ralph-loop**: Autonomous issue-driven build loop. Implements open GitHub Issues labelled `ready-for-agent` one at a time in dependency order using sub-agents. Use when user says "ralph loop", "start building", "implement all issues", or invokes `/ralph`. See `.agents/skills/ralph-loop/SKILL.md`.
