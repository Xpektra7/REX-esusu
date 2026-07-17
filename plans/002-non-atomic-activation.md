# Plan 002: Fix Non-Atomic Circle Activation

**Status:** TODO
**Priority:** P1
**Effort:** M
**Risk:** MED
**Depends on:** none
**Category:** bug
**Planned at:** commit 1e67046, 2026-07-17

## Why this matters

Circle activation does two writes: update circle to `active`, then insert cycle 1. If the insert fails, the circle stays `active` with no cycle — a permanently stuck state requiring manual DB fix.

## Current state

`src/app/api/v1/circles/[id]/activate/route.ts:68-87`:
1. `UPDATE circles SET status = 'active', current_cycle = 0`
2. `INSERT INTO cycles (circle_id, cycle_number = 1, ...)`

No transaction wrapping. If step 2 fails, step 1 is already committed.

## Steps

1. Reorder: insert cycle *first*, then update circle status only on success.
2. If cycle insert fails, return error 500 without updating circle.
3. Also fix the `joined_at_cycle` off-by-one: for mid-cycle joins (circle already active), use `current_cycle` not `current_cycle + 1`.

## Done criteria

- [ ] Activation is atomic — cycle insert happens first
- [ ] Mid-cycle join uses correct cycle number
- [ ] `npx tsc --noEmit` passes
