# Plan 010: Harden proxy.ts auth with HttpOnly cookie + JWT verification

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat e041804..HEAD -- src/proxy.ts src/stores/auth-store.ts src/app/api/v1/auth/ src/lib/middleware.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `e041804`, 2026-07-17

## Why this matters

The sole auth enforcement layer for all dashboard routes checks `request.cookies.has("esusu-auth")` — a cookie set **client-side** via `document.cookie` **without** `HttpOnly`, `Secure`, or `SameSite=Strict`. Any user can forge `document.cookie = "esusu-auth=true"` and bypass all route protection. The proxy does **not** verify the JWT — it only checks cookie existence. Per Vercel's guidance (CVE-2025-29927 postmortem), proxy should handle lightweight routing/rate-limiting only, not auth enforcement.

## Current state

- `src/proxy.ts:39`: `request.cookies.has("esusu-auth")` — existence check only, no JWT verification
- `src/stores/auth-store.ts:88`: Sets cookie via `document.cookie`, no `HttpOnly`/`Secure`/`SameSite=Strict`
- `src/lib/middleware.ts`: `requireAuth()` helper exists for API route handlers but never runs for page routes
- `src/app/api/v1/auth/verify/route.ts:128`: Signs JWT with `signToken(id, email)`, returns in response body
- The `authStore` stores `accessToken` and `refreshToken` in localStorage (Zustand persist)

Convention: API routes use `requireAuth()` from `src/lib/middleware.ts` which verifies the Bearer JWT. Page routes have no server-side protection.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Lint      | `npx biome check .`      | exit 0              |

## Scope

**In scope**:
- `src/proxy.ts` — add CORS handling, security headers; remove auth redirect logic
- `src/lib/middleware.ts` — add `requirePageAuth()` that verifies JWT from cookie
- `src/stores/auth-store.ts` — stop setting `document.cookie`; server sets it
- `src/app/api/v1/auth/verify/route.ts` — set `HttpOnly` cookie on login response
- `src/app/api/v1/auth/refresh/route.ts` — set `HttpOnly` cookie on refresh

**Out of scope**:
- Do NOT change the API token auth (Bearer header) — that works via `requireAuth()`
- Do NOT change the JWT signing logic in `src/lib/auth.ts`
- Do NOT change the Zustand store's localStorage persistence

## Steps

### Step 1: Add `setAuthCookie` and `clearAuthCookie` helpers

Create helper functions in `src/lib/auth.ts` that set/clear an HttpOnly Secure SameSite=Strict cookie:

```ts
// Add to src/lib/auth.ts
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set("esusu-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 30, // 30 minutes
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set("esusu-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
```

**Verify**: `npx tsc --noEmit` exits 0.

### Step 2: Set HttpOnly cookie on login/verify

In `src/app/api/v1/auth/verify/route.ts`:
- Import `NextResponse` and `setAuthCookie`
- After `signToken(existing.id, existing.email)`, call `setAuthCookie(response, token)` where `response` is the `NextResponse.json({...})` for the success path
- Return the response

In `src/app/api/v1/auth/refresh/route.ts`:
- Same pattern — call `setAuthCookie` on successful refresh

**Verify**: Login response includes `Set-Cookie: esusu-token=...` header with `HttpOnly; Secure; SameSite=Strict`.

### Step 3: Add JWT verification helper for page routes

In `src/lib/middleware.ts`, add:

```ts
import { verifyToken } from "./auth";
import { type NextRequest, NextResponse } from "next/server";

export function requirePageAuth(request: NextRequest): { userId: string } | null {
  const token = request.cookies.get("esusu-token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  return { userId: decoded.sub };
}
```

**Verify**: `npx tsc --noEmit` exits 0.

### Step 4: Update proxy.ts

Replace the auth redirect logic in `src/proxy.ts`:

1. Import `requirePageAuth` from `@/lib/middleware`
2. Replace the cookie existence check with `requirePageAuth(request)`
3. Keep rate-limiting logic unchanged
4. Keep the `/forgot-password` route in PUBLIC_ROUTES
5. Add CORS headers for API routes:
   ```ts
   // Before rate-limit checks
   if (request.method === "OPTIONS") {
     return new NextResponse(null, {
       status: 204,
       headers: {
         "Access-Control-Allow-Origin": "*",
         "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
         "Access-Control-Allow-Headers": "Content-Type, Authorization",
         "Access-Control-Max-Age": "86400",
       },
     });
   }
   ```
6. Add security headers to all responses:
   ```ts
   const response = NextResponse.next();
   response.headers.set("X-Frame-Options", "DENY");
   response.headers.set("X-Content-Type-Options", "nosniff");
   response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
   response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
   ```
7. Set CORS headers on API responses:
   ```ts
   if (pathname.startsWith("/api/")) {
     response.headers.set("Access-Control-Allow-Origin", "*");
   }
   ```

**Verify**: `npx tsc --noEmit` exits 0.

### Step 5: Update auth-store to stop setting document.cookie

In `src/stores/auth-store.ts`:
- Remove the `document.cookie` line (around line 88)
- The cookie is now set server-side in the login/verify response
- The client still needs to know if the user is authenticated — use the presence of `accessToken` in the store (already tracked)
- Add a `fetchUser` action that calls `GET /api/v1/users/me` to hydrate user state, or rely on the login response data

**Verify**: `npx tsc --noEmit` exits 0.

### Step 6: Add login endpoint for password auth

Currently `verify/route.ts` handles both OTP verification and password login. Ensure the login path (`/api/v1/auth/login`) also sets the cookie. If it doesn't exist, it should:

```ts
// POST /api/v1/auth/login
// Body: { email, password }
// Response: sets esusu-token cookie, returns user data
```

**Verify**: Logging in via the sign-in page sets the `esusu-token` cookie.

## Test plan

No existing test suite for auth. Manual verification:
1. Sign up a new user — confirm `esusu-token` cookie is set with `HttpOnly` + `Secure` + `SameSite=Strict`
2. Navigate to `/dashboard` — confirm redirect to `/signin` when no cookie
3. Set `document.cookie = "esusu-token=fake"` — confirm redirect to `/signin` (JWT verification rejects the fake token)
4. Log out — confirm cookie is cleared
5. Refresh token — confirm cookie is updated

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] Cookie is set server-side with `HttpOnly`, `Secure`, `SameSite=Strict`
- [ ] `document.cookie` no longer appears in auth-store.ts
- [ ] Forged cookie `"esusu-token=fake"` does NOT grant access to dashboard
- [ ] OPTIONS requests to `/api/v1/*` return 204 with CORS headers
- [ ] API responses include `Access-Control-Allow-Origin: *`
- [ ] All responses include security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- `src/lib/auth.ts` doesn't export `signToken` or `verifyToken` — check the file first
- `src/stores/auth-store.ts` doesn't have the `document.cookie` line at the expected location
- Login form doesn't call `/api/v1/auth/verify` — check the frontend login flow

## Maintenance notes

- Next deprecation: proxy.ts should remain thin. If more auth logic accumulates here, push it into route handlers.
- Cookie name `esusu-token` must match between proxy.ts and the auth routes.
- If the app adds subdomains, cookie `domain` attribute may need adjustment.
