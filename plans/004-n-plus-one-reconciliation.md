# Plan 004: Batch N+1 Queries in Reconciliation Engine

**Status:** TODO
**Priority:** P1
**Effort:** M
**Risk:** MED
**Depends on:** none
**Category:** perf
**Planned at:** commit 1e67046, 2026-07-17

## Why this matters

`reconcileCycle` issues 4+ queries per member (contributions, user names, member info). For a 20-member circle that's 80+ DB round-trips per cycle close. This will timeout Nomba webhooks as the app scales.

## Current state

Key N+1 hotspots in `src/lib/reconciliation.ts`:
- `reconcileCycle`: one `SELECT sum(amount_kobo)` per member
- One user query per member for names
- `getExpectedPerActiveCircle`: 4 queries per member
- `applyFifoDebtClearing`: per-debt-row UPDATEs
- `getMemberCircleIds` called redundantly 3 times

## Steps

1. Replace per-member contribution queries with one `GROUP BY member_circle_id` batch query.
2. Replace per-member user queries with one `WHERE id IN (...)` query.
3. Cache `getMemberCircleIds` result — call once, pass to downstream functions.
4. Batch debt UPDATEs: collect into two sets (fully cleared, partial), issue two `UPDATE ... WHERE id IN (...)`.

## Done criteria

- [ ] `reconcileCycle` issues no more than 5 total queries regardless of member count
- [ ] No redundant `getMemberCircleIds` calls
- [ ] Debt clearing uses batch UPDATEs
- [ ] `npm run test` passes
