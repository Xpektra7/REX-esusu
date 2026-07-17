# Plan 003: Align Env Vars, .env.example, and .env Validation

**Status:** TODO
**Priority:** P1
**Effort:** S
**Risk:** LOW
**Depends on:** none
**Category:** bug
**Planned at:** commit 1e67046, 2026-07-17

## Why this matters

The code reads `NOMBA_CLIENT_ID`, `NOMBA_CLIENT_SECRET`, `NOMBA_ACCOUNT_ID`, `NOMBA_WEBHOOK_SECRET` but `.env.example` and README document `NOMBA_TEST_CLIENT_ID`, `NOMBA_LIVE_CLIENT_ID`, etc. A developer following `.env.example` will set up wrong env vars and Nomba silently fails. At runtime, missing vars crash with opaque TypeError.

## Current state

- `src/lib/nomba.ts:4-7` reads `NOMBA_CLIENT_ID!`, `NOMBA_CLIENT_SECRET!`, `NOMBA_ACCOUNT_ID!`, `NOMBA_WEBHOOK_SECRET!`
- `.env.example` has 7 vars (missing JWT_SECRET, SMTP_HOST, etc.)
- `src/lib/supabase.ts` and `supabase-server.ts` also use `!` assertions

## Steps

1. Create `src/lib/env.ts` that reads all required env vars using `process.env.X || ""` (not `!`), validates them, and exports typed constants.
2. Replace all `process.env.X!` in `src/lib/nomba.ts`, `src/lib/supabase.ts`, `src/lib/supabase-server.ts` with imports from `env.ts`.
3. Update `.env.example` with all required vars matching the code, grouped by domain.

## Done criteria

- [ ] `src/lib/env.ts` created with all required typed vars
- [ ] No `process.env.X!` non-null assertions in source code
- [ ] `.env.example` has all required vars documented
- [ ] `npx tsc --noEmit` passes
