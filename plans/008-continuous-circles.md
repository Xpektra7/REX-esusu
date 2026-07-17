# Plan 008: Support Continuous (Multi-Cycle) Circles

**Status:** TODO
**Priority:** P2
**Effort:** M
**Risk:** LOW
**Depends on:** not
**Category:** direction
**Planned at:** commit 1e67046, 2026-07-17

## Why this matters

Real Ajo groups run continuously — they don't complete and disband. Currently circles have a finite `cycleCount`. When the last cycle completes, the circle is dead. Users must manually re-create, losing trust scores, member list, and history.

## Current state

- `src/db/schema.ts:47` — `cycleCount` is required, no `null` option for continuous
- `src/lib/reconciliation.ts:606-611` — when `cycleNumber >= cycleCount`, circle set to `completed`
- `src/app/api/v1/circles/route.ts:93-101` — `cycleCount` required on create

## Steps

1. Make `cycleCount` nullable in schema. `null` = continuous.
2. In `reconcileCycle`, if `cycleCount` is null, auto-create next cycle instead of completing.
3. Add "Continuous" toggle to create-circle form UI.
4. Update circle card UI to show "Ongoing" badge for continuous circles.

## Done criteria

- [ ] Continuous circles auto-start new cycle on completion
- [ ] `cycleCount = null` works end-to-end
- [ ] `npx tsc --noEmit` passes
