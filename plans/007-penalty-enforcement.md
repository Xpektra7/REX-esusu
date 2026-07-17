# Plan 007: Enforce ₦500 Default Penalty

**Status:** TODO
**Priority:** P2
**Effort:** M
**Risk:** MED
**Depends on:** not
**Category:** direction
**Planned at:** commit 1e67046, 2026-07-17

## Why this matters

FAQ and Terms page promise a ₦500 fine for missed contributions. The `fineKobo` column exists in the DB schema but is never written. This is a trust gap — users read about a penalty that's never enforced.

## Current state

- `src/db/schema.ts:193` — `fineKobo: integer("fine_kobo").default(0).notNull()` exists
- `src/types/index.ts:99` — `fineKobo: number` type exists
- `src/lib/reconciliation.ts` — reconciliation creates debts but never sets `fineKobo`

## Steps

1. In `reconcileCycle` (reconciliation.ts ~line 456), when computing deficit for a missed payment, add `fineKobo: 50000` (₦500 in kobo) to the debt.
2. The fine is added to the outstanding debt balance. When the defaulter pays, FIFO clearing applies the fine portion first.
3. Update the report endpoint to show accumulated fines per member.

## Done criteria

- [ ] Missed contributions include ₦500 fine in debt record
- [ ] FIFO debt clearing handles fine correctly
- [ ] `npm run test` passes
