# Plan 003: Harden — rate limiting, webhook error ack, OTP log cleanup

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 279fc5d..HEAD -- src/lib/rate-limit.ts src/app/api/v1/webhooks/nomba/route.ts src/lib/otp.ts src/app/api/v1/auth/send-otp/route.ts package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `279fc5d`, 2026-07-09

## Why this matters

Three independent small hardening items:

1. **No rate limiting** — the API has zero protection against brute force (login, OTP, BVN enumeration) or DoS. No `rateLimit`/`ratelimit`/`rate-limit` exists in `src/`.
2. **Webhook returns `"00"` on failure** — `src/app/api/v1/webhooks/nomba/route.ts:91-96` returns HTTP 200 with `"00"` (success code) when payment processing throws. This tells Nomba the webhook succeeded, so they'll never retry. Nomba will assume the payment was processed and the customer won't get credit — irreversible data loss.
3. **OTP logged in dev, error messages leak internals** — `src/lib/otp.ts:34` logs the OTP to console in dev. Various routes return `error((e as Error).message)` which can leak SQL errors, stack traces, and internal info to the client.

## Current state

### Rate limiting — nothing exists

```bash
grep -rn "rateLimit\|rate.limit\|ratelimit\|RateLimit" src/  # → empty (confirmed at 279fc5d)
```

`package.json` — check dependencies for `@upstash/ratelimit`, `express-rate-limit`, `arcjet`, or similar. Also check for `ioredis`, `@upstash/redis`, or any KV store.

### `src/app/api/v1/webhooks/nomba/route.ts` — outer catch at ~91-96

```typescript
} catch (e) {
  console.error("Webhook error:", e);
  return NextResponse.json({ status: "00" }, { status: 200 });  // WRONG: returns success on failure
}
```

Nomba expects:
- `"00"` with `status: 200` → success (processing done, no retry needed)
- `"09"` with `status: 200` → temporary failure (Nomba will retry with backoff)
- Any non-200 → varies by provider

### `src/lib/otp.ts:34`

```typescript
console.log(`[OTP] Generated OTP for ${email}: ${otp}`);
```

### Error message pattern in routes

Many routes have `catch (e) { return error((e as Error).message); }` instead of sanitizing. Example from various route files — the raw `e.message` may contain SQL query text, column names, or stack traces.

### Repo conventions

- Error responses via `success()` / `error()` from `src/lib/api-response.ts`.
- Environment variables via `process.env.*`.
- Node built-in test runner: `tsx --test`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npx tsc --noEmit` | exit 0, no errors |
| Test | `npx tsx --test scripts/rate-limit.test.ts` | all pass |
| Lint | `npx biome check src/` | exit 0 |

## Scope

**In scope**:
- `src/lib/rate-limit.ts` — CREATE: in-memory sliding-window rate limiter
- `src/middleware.ts` — add rate limit check (if plan 002 ran first)
- `src/app/api/v1/webhooks/nomba/route.ts` — change 200 → 400 on error
- `src/lib/otp.ts` — remove dev OTP log
- `src/app/api/v1/auth/` — sanitize catch handlers (security-related only)
- Any other route with `error((e as Error).message)` — replace with generic message

**Out of scope**:
- Database-backed rate limiting (in-memory is fine for MVP)
- Rate limiting on page routes
- Upstash/Redis integration (deferred — use in-memory for now)
- Full audit of every catch handler — just the pattern fix

## Steps

### Step 1: Create `src/lib/rate-limit.ts`

In-memory sliding-window rate limiter using a `Map<string, number[]>`:

```typescript
const requestLogs = new Map<string, number[]>();

export function rateLimit(options: { windowMs?: number; maxRequests?: number } = {}) {
  const { windowMs = 60000, maxRequests = 20 } = options;

  return {
    check: (key: string): { allowed: boolean; remaining: number; resetIn: number } => {
      const now = Date.now();
      const windowStart = now - windowMs;

      let timestamps = requestLogs.get(key) || [];
      timestamps = timestamps.filter((t) => t > windowStart);

      if (timestamps.length >= maxRequests) {
        return { allowed: false, remaining: 0, resetIn: timestamps[0] + windowMs - now };
      }

      timestamps.push(now);
      requestLogs.set(key, timestamps);

      return { allowed: true, remaining: maxRequests - timestamps.length, resetIn: windowMs };
    },
  };
}
```

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: Wire rate limiter into middleware

If `src/middleware.ts` was created by plan 002, add rate limiting to sensitive paths. Add before the existing middleware logic:

```typescript
import { rateLimit } from "@/lib/rate-limit";

const apiLimiter = rateLimit({ windowMs: 60000, maxRequests: 30 });
const authLimiter = rateLimit({ windowMs: 60000, maxRequests: 5 });

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  // Stricter limits for auth routes
  if (pathname.startsWith("/api/v1/auth/")) {
    const result = authLimiter.check(`auth:${ip}`);
    if (!result.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(result.resetIn / 1000)) } }
      );
    }
  }

  // ... rest of middleware logic from plan 002
}
```

**Verify**: `grep "rateLimit" src/middleware.ts` → import and usage exist. `npx tsc --noEmit` → exit 0.

### Step 3: Fix webhook error ack

In `src/app/api/v1/webhooks/nomba/route.ts`, change the outer catch:

```typescript
} catch (e) {
  console.error("Webhook error:", e);
  return NextResponse.json({ status: "09" }, { status: 200 });
  // "09" = temporary failure — Nomba will retry with backoff
}
```

Also ensure the **inner** catch (payment processing) returns `"09"` as well — check the existing inner try/catch.

**Verify**: `grep -A2 "status: 200" src/app/api/v1/webhooks/nomba/route.ts` → shows `"09"` not `"00"`. `npx tsc --noEmit` → exit 0.

### Step 4: Remove OTP log in `src/lib/otp.ts`

Delete or comment out:
```typescript
console.log(`[OTP] Generated OTP for ${email}: ${otp}`);
```

If the log was useful during development, replace with a generic log that doesn't leak the OTP:
```typescript
console.log(`[OTP] Generated and sent OTP for ${email}`);
```

**Verify**: `grep "Generated OTP for" src/lib/otp.ts` → no matches with the OTP value.

### Step 5: Sanitize error messages

Find all instances of `error((e as Error).message)` and replace with a generic safe message. Use grep first:

```bash
grep -rn "error((e as Error).message)" src/
```

For each instance, replace with:
```typescript
error("An unexpected error occurred", 500)
```

But keep the `console.error(e)` line if it exists above the return.

**Verify**: `grep -rn "error((e as Error).message)" src/` → no matches. `npx tsc --noEmit` → exit 0.

## Test plan

- Manual test for rate limiting: Hit `/api/v1/auth/login` 6+ times in 60s → 429 on the 6th request.
- Manual test for webhook: Send an invalid payload to `/api/v1/webhooks/nomba` → observe `"09"` in response body, not `"00"`.
- If `scripts/rate-limit.test.ts` exists, run it: `npx tsx --test scripts/rate-limit.test.ts`.
- If not, create it with two test cases: (1) calling `check()` 5 times for the same key allows all, (2) calling 6x blocks the 6th.

## Done criteria

- [ ] `src/lib/rate-limit.ts` exists and exports `rateLimit`
- [ ] `src/middleware.ts` imports and uses rate limiter on `/auth/` routes
- [ ] `grep "\"00\"" src/app/api/v1/webhooks/nomba/route.ts` → no matches
- [ ] `grep "\"09\"" src/app/api/v1/webhooks/nomba/route.ts` → at least one match
- [ ] `grep "console.log.*OTP.*otp" src/lib/otp.ts` → no matches
- [ ] `grep -rn "error((e as Error).message)" src/` → no matches
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/` exits 0 (or same errors as before)

## STOP conditions

- `src/middleware.ts` does not exist and you can't create it (would need Next.js project structure — verify `next.config.js` or `next.config.ts` exists).
- The `x-forwarded-for` header pattern is different in the codebase (e.g., behind a specific proxy like Cloudflare) — check existing middleware or config for IP extraction pattern.
- Rate limiting dep is already in `package.json` (e.g., `@upstash/ratelimit`) — use that infrastructure instead of creating an in-memory one.
- A verification command fails twice after a reasonable fix attempt.

## Maintenance notes

- In-memory rate limiter resets on server restart and doesn't work in serverless deployments with multiple instances. The `requestLogs` Map grows unbounded — for production, add a TTL cleanup interval or switch to Upstash/Redis.
- The `maxRequests: 5` for auth routes is aggressive. Adjust based on real usage patterns after launch.
- If Nomba's webhook retry policy changes (they start ignoring `"09"`), the error ack will need updating to return HTTP 4xx instead.
