# Plan 002: Secure auth — page guard middleware, BVN endpoint auth, JWT hardening

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 279fc5d..HEAD -- src/middleware.ts src/app/api/v1/verify-bvn/route.ts src/lib/auth.ts src/lib/jwt.ts src/lib/api-response.ts src/app/api/v1/auth/login/route.ts src/app/api/v1/auth/register/route.ts src/lib/auth-store.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `279fc5d`, 2026-07-09

## Why this matters

Three independent holes that together make the API trivially exploitable:

- **H-02: No page-level auth guard middleware**. Auth is checked per-endpoint via `requireAuth()` (good), but there is no `src/middleware.ts` file. If a new route is added and the developer forgets `requireAuth()`, the route is public. A Next.js `middleware.ts` catches ALL routes at the edge — a defense-in-depth layer.
- **H-03: BVN endpoint is wide open**. `GET /api/v1/verify-bvn/8341234567` returns hardcoded personal data (`"Chioma Okafor"`) with no auth check. BVN data is PII protected by Nigerian data privacy law (NDPR).
- **H-04: JWT secret can be empty string**. `process.env.JWT_SECRET || ""` means a missing env var silently creates trivially forgeable tokens. Also: `verifyToken` doesn't restrict `algorithms: ["HS256"]`, opening a potential algorithm confusion vector in some library versions.

## Current state

### `src/middleware.ts` — DOES NOT EXIST

There is no `src/middleware.ts` at `279fc5d`. Auth is handled per-page by importing `requireAuth` from `src/lib/auth.ts` inside each API route handler. A Next.js `middleware.ts` at `src/middleware.ts` can apply `matcher` patterns to catch all API routes.

Status quo in `src/app/api/v1/verify-bvn/route.ts:10`:
```typescript
// NO requireAuth() call
export async function GET(req: NextRequest, { params }: { params: { bvn: string } }) {
```

### `src/lib/auth.ts:8`
```typescript
const JWT_SECRET = process.env.JWT_SECRET || "";
```

Auth function signature:
```typescript
export async function requireAuth(request: NextRequest): Promise<SessionUser | Response> {
  const token = request.cookies.get("session")?.value;
  // ... verifyToken with no algorithms restriction
}
```

### `src/app/api/v1/verify-bvn/route.ts`

Full file at `279fc5d`:
```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { bvn: string } }) {
  const { bvn } = params;

  if (!bvn || bvn.length !== 11) {
    return NextResponse.json({ error: "Invalid BVN" }, { status: 400 });
  }

  const mockResponse = {
    bvn,
    firstName: "Chioma",
    lastName: "Okafor",
    dob: "1990-05-15",
    phone: "08031234567",
    status: "found",
  };

  return NextResponse.json(mockResponse);
}
```

### `src/lib/auth-store.ts:88`

Client-side sets cookie from login response:
```typescript
document.cookie = `esusu-auth=true;path=/;max-age=86400`;
```

The cookie name `esusu-auth` is what the middleware should check to provide a non-API fallback for page routes.

### Repo conventions

- API response shape: `{ success: true, data: ... }` or `{ success: false, error: ... }` via `src/lib/api-response.ts` — except the BVN endpoint which returns raw `NextResponse.json()`.
- Next.js App Router: middleware goes in `src/middleware.ts`.
- Environment variables: read via `process.env.*` with proper fallbacks.
- All existing authenticated routes use `requireAuth` as first line in handler.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npx tsc --noEmit` | exit 0, no errors |
| Lint | `npx biome check src/` | exit 0 |
| Test | `npx tsx --test scripts/auth.test.ts` | all pass (if exists) |

## Scope

**In scope**:
- `src/middleware.ts` — CREATE: Next.js middleware for auth guard
- `src/app/api/v1/verify-bvn/route.ts` — add `requireAuth`, use `api-response.ts`
- `src/lib/auth.ts` — fix empty `JWT_SECRET`, restrict algorithms in verify
- `src/lib/jwt.ts` — CREATE (extract sign/verify if they're inline in auth.ts)

**Out of scope**:
- Login/register rewrite — they work and this plan doesn't touch them
- Frontend pages — middleware redirect should work but no page changes
- Any other route's auth — only the BVN route is missing `requireAuth`

## Steps

### Step 1: Create `src/middleware.ts`

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_API_PATTERNS = [
  /^\/api\/v1\/auth\/login/,
  /^\/api\/v1\/auth\/register/,
  /^\/api\/v1\/webhooks\//,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through
  if (PUBLIC_API_PATTERNS.some((p) => p.test(pathname))) {
    return NextResponse.next();
  }

  // Check auth cookie for API routes
  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("session")?.value;
    const authCookie = request.cookies.get("esusu-auth")?.value;

    if (!token && !authCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
```

**Verify**: `ls src/middleware.ts` → file exists. `npx tsc --noEmit` → exit 0.

### Step 2: Add `requireAuth` to BVN endpoint

Change `src/app/api/v1/verify-bvn/route.ts`:

```typescript
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { success, error } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: { bvn: string } }) {
  const user = await requireAuth(req);
  if (user instanceof Response) return user;

  const { bvn } = params;
  if (!bvn || bvn.length !== 11) {
    return error("Invalid BVN", 400);
  }

  // ... rest unchanged, but wrap return in success()
  return success(mockResponse);
}
```

**Verify**: `grep "requireAuth" src/app/api/v1/verify-bvn/route.ts` → found. `npx tsc --noEmit` → exit 0.

### Step 3: Fix JWT secret fallback in `src/lib/auth.ts`

Change:
```typescript
const JWT_SECRET = process.env.JWT_SECRET || "";
```
To:
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}
```

And in the `verifyToken` function, add the `algorithms` option:
```typescript
const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as JwtPayload;
```

**Verify**: `grep "JWT_SECRET" src/lib/auth.ts` → the old `|| ""` fallback is gone. `npx tsc --noEmit` → exit 0.

### Step 4: Verify the full flow compiles and works

```bash
npx tsc --noEmit
npx biome check src/middleware.ts src/lib/auth.ts src/app/api/v1/verify-bvn/route.ts
```

## Test plan

- Manual test: Start the dev server, hit `GET /api/v1/verify-bvn/12345678901` without auth cookie → 401.
- Manual test: Hit the same with auth cookie → 200 with mock response.
- If `scripts/auth.test.ts` exists, run it: `npx tsx --test scripts/auth.test.ts`.
- Verify `GET /api/v1/auth/login` still works without auth (public route pattern).

## Done criteria

- [ ] `src/middleware.ts` exists and exports a working middleware
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/` exits 0
- [ ] `grep -rn '\|\| ""' src/lib/auth.ts` returns no matches
- [ ] `grep "algorithms" src/lib/auth.ts` shows `algorithms: ["HS256"]` in the verify call
- [ ] `grep "requireAuth" src/app/api/v1/verify-bvn/route.ts` — found
- [ ] `grep "success\|error" src/app/api/v1/verify-bvn/route.ts` — both used (not raw `NextResponse.json`)

## STOP conditions

- `src/middleware.ts` already exists — stop and read it, the plan may be outdated.
- The `JWT_SECRET` env var has a different pattern elsewhere in the code (e.g., different loader like `@t3-oss/env-nextjs`) — inline the pattern used by the rest of the project, don't use raw `process.env` if the project uses `env.mjs`/`env.ts`.
- A verification command fails twice after a reasonable fix attempt.

## Maintenance notes

- The middleware only covers API routes. If page routes (non-API) need auth protection, expand the `matcher` config and check the `session` cookie directly in middleware instead of the `esusu-auth` boolean.
- The `JWT_SECRET` runtime check throws at module import time — this means an unset env var crashes the process on first request to any route importing `auth.ts`. That's intentional (fail-fast).
- If the project later upgrades the JWT library, the `algorithms` restriction may need updating depending on the new API.
