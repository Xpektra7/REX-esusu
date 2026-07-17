# Plan 005: Fix API Double-Prefix, Join Validator, and Input Export

**Status:** TODO
**Priority:** P1
**Effort:** S
**Risk:** MED
**Depends on:** none
**Category:** bug
**Planned at:** commit 1e67046, 2026-07-17

## Why this matters

Three small bugs that block functionality: circles list and join-by-code don't work due to double API prefix; invite code validator bypasses Zod pattern; Input component mis-exported from button.tsx.

## Current state

- `src/lib/api.ts:3` — `API_BASE = '/api/v1'`, but callers also prefix: `api.get('/api/v1/circles')` → results in `/api/v1/api/v1/circles`
- `src/app/api/v1/circles/join-by-code/route.ts:6-11` — inline validator instead of Zod schema
- `src/components/ui/button.tsx:41-54` — exports `Input` (should be in own file)

## Steps

1. Change `API_BASE` default to `''` in `src/lib/api.ts`. Remove `/api/v1` prefix from all callers.
2. Create `Input` in `src/components/ui/input.tsx`, import from correct path in consumers.

## Done criteria

- [ ] `api.get('/api/v1/circles')` hits `/api/v1/api/v1/circles` — fixed to `/api/v1/circles`
- [ ] `Input` component in own file
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
