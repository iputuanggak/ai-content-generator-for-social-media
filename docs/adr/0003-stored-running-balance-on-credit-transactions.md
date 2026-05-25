# ADR 0003: Stored running balance on credit transactions

**Status:** Accepted

**Date:** 2026-05-25

## Context

The credit ledger (Transaction History) currently shows Type, Amount, and Date per row. Users cannot see how their balance changed over time — they must mentally sum transactions to understand their balance at any point.

Additionally, `deductCredits` creates one `credit_transaction` row per Credit Batch touched during a FIFO deduction. A single generation that spans 2 batches produces 2 ledger rows with the same type and `referenceId`, which is confusing for users and makes the `batchId` link on transactions the only way to tell them apart.

Alternatives considered:
1. **Compute running balance at read time using SQL window functions** — no schema change, but pagination requires knowing cumulative totals from all prior pages. Performance degrades with scale.
2. **Store only `balance_after`, derive `balance_before`** — single source of truth, but loses the integrity check that two stored values provide.
3. **Store both `balance_before` and `balance_after`** — redundant but provides a built-in consistency check. Standard in financial ledgers.

## Decision

- **Store both `balance_before` and `balance_after`** (integer columns) on every `credit_transaction` row at write time.
- **Collapse multi-batch FIFO deductions into a single transaction row.** The batch-level operational detail remains on `credit_batch.remaining`. The transaction becomes a user-facing ledger entry.
- **Drop `batchId` from `credit_transaction`.** The column only linked to a single batch, which is meaningless for collapsed multi-batch rows. `referenceId` (generation ID or platform output ID) remains for tracing.
- **Backfill existing transactions** with computed running balances via a one-time migration script.

Write paths affected: `grantStarterCredits`, `addTopUpCredits`, `deductCredits` — each now reads the current team balance, computes before/after, and writes both values.

## Consequences

**Positive:**
- Users see a complete running balance in the ledger — "how many credits did I have before and after this event?"
- Pagination is trivial — each row is self-contained, no cross-page computation needed
- Stored before/after provides a data integrity check: `balance_before + amount` must equal `balance_after`
- Single-row deductions match user mental model ("this generation cost 5 credits"), not internal FIFO mechanics
- Simpler `credit_transaction` schema without `batchId`

**Negative:**
- Schema migration required (add two columns, drop one, backfill data)
- Write paths must read current balance before writing — slight additional query per credit operation
- Denormalized data: `balance_before` is technically derivable from the previous row's `balance_after`, creating a potential inconsistency if writes race
- Dropping `batchId` removes the direct audit link between a transaction and the specific batch(es) consumed (mitigated by `credit_batch.remaining` and `referenceId`)
