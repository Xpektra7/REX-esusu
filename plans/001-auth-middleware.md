# Plan 001: Auth Middleware — Protect Dashboard Routes

**Status:** TODO
**Priority:** P1
**Effort:** M
**Risk:** MED
**Depends on:** none
**Category:** security
**Planned at:** commit 1e67046, 2026-07-17

## Why this matters

Currently any unauthenticated user can access `/dashboard`, `/wallet`, `/circles`, `/settings` — all protected routes. Auth is enforced only client-side via Zustand store. A fintech app with exposed dashboard routes is a security risk.

## Current state

- `src/proxy.ts` exists but is dead code — not exported, not imported, no middleware function
- `src/stores/auth-store.ts` sets a client-side `esusu-auth` cookie (`HttpOnly`/`Secure` missing)
- No `src/middleware.ts` exists
- All `(dashboard)` routes are publicly accessible

## Steps

1. Create `src/middleware.ts` that checks `Authorization: Bearer` header or `esusu-auth` cookie. Redirects to `/signin` if missing. Skips middleware for `/api/`, `/_next/`, public assets.
2. Move cookie-setting server-side: in `src/app/api/v1/auth/verify/route.ts` and refresh route, set `esusu-auth` cookie with `HttpOnly`, `Secure`, `SameSite=Strict`.
3. Add `server-only` guard to `src/lib/supabase-server.ts`.
4. Fix CORS in `next.config.ts`: replace `'*'` with `process.env.FRONTEND_URL`.

## Done criteria

- [ ] `/dashboard` redirects to `/signin` when not authenticated
- [ ] `src/middleware.ts` created and working
- [ ] Cookie set server-side with HttpOnly + Secure
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
