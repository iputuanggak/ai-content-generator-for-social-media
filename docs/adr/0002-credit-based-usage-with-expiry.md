# ADR 0002: Credit-based usage system with 12-month FIFO expiry

**Status:** Accepted

**Date:** 2026-05-25

## Context

Content generation uses OpenRouter AI calls, which cost real money per request. We need a monetization model that:
- Prevents unbounded usage
- Gives users predictable costs
- Works for teams with shared budgets
- Is simple to understand

Alternatives considered:
1. **Flat subscription** (e.g., $20/mo unlimited) — risky because power users could cost more than revenue
2. **Metered billing** (charge per API call on the backend, bill monthly) — unpredictable for users, complex invoicing
3. **Credit packages with no expiry** — simpler, but credits can accumulate indefinitely, creating a liability
4. **Credit packages with expiry** — encourages active use, limits financial liability

## Decision

Implement a credit system where:
- **Credits belong to the Team** (organization), not individual users
- **1 credit = 1 Platform Output** (generation or regeneration)
- **Credits are deducted per successful output**, not upfront
- **Pre-check blocks generation** if the team doesn't have enough credits for all active platforms
- **Credits expire 12 months** from the batch creation date, consumed in FIFO order (oldest first)
- **Top-ups via Stripe Checkout** (hosted page) with three fixed packages:
  - Starter: 100 credits / $5 ($0.050/credit)
  - Growth: 500 credits / $20 ($0.040/credit)
  - Pro: 2000 credits / $60 ($0.030/credit)
- **25 free starter credits** granted on team creation (also expire in 12 months)
- **Any member** can top up credits (not just admins)
- **Full transaction history** stored in the database for audit and user-facing credit ledger

Data model uses two tables:
- `credit_batch` — tracks each batch of credits with remaining balance and expiry date (operational)
- `credit_transaction` — immutable audit log of every credit event (top-up, deduction, expiry)

## Consequences

**Positive:**
- Revenue is directly tied to usage — no uncapped liability from power users
- Users see exactly what they're paying for (1 credit per platform output)
- Team-owned credits match the existing team-centric model (brand settings, model selection, generation history)
- FIFO with expiry limits financial liability from hoarded credits
- Stripe Checkout minimizes PCI scope and implementation effort
- Transaction history provides transparency and supports dispute resolution

**Negative:**
- More complex than a flat subscription — requires batch tracking, FIFO logic, and expiry handling
- 12-month expiry may frustrate users who don't generate frequently (mitigated by the 30-day expiry warning)
- Per-success deduction means a team could start a generation with barely enough credits and get partial results if some succeed and some fail (mitigated by the pre-check that requires credits >= active platforms)
- Any member being able to top up means a member could spend money without admin oversight
- Stripe webhook dependency — if the webhook fails, credits won't be added (requires retry/reconciliation logic)
