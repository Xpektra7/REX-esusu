# Plan 006: Small hygiene — OTP schema, dead deps, duplicate routes, Biome config

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 279fc5d..HEAD -- src/lib/validations.ts src/lib/otp.ts package.json src/app/api/v1/bank-codes/ route.ts src/app/api/v1/bank-lookup/route.ts src/app/api/v1/bank-search/route.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `279fc5d`, 2026-07-09

## Why this matters

Four independent low-effort cleanups that prevent subtle bugs and reduce maintenance surface:

1. **OTP validation lies (L-01)**: `src/lib/validations.ts` says "OTP must be 4 digits" (`.length(4)`), but `src/lib/otp.ts:28` generates a 6-digit OTP (`100000 + Math.random() * 900000`). Every OTP verify will reject legitimate 6-digit codes — users enter 6 digits seen in email, validation says "must be 4 digits".
2. **Dead dependencies**: `@supabase/supabase-js` and `resend` are in `package.json` but **never imported anywhere** in `src/`. They unnecessarily bloat the bundle and install.
3. **Duplicate bank routes**: Four routes (`bank-codes`, `bank-lookup`, `bank-search` + `transfers/banks`, `transfers/bank-lookup`) call the exact same Nomba endpoints with slightly different response shapes. The intent was probably one canonical location — the duplicate just adds maintenance confusion.
4. **Biome configuration**: No check whether `biome.json` exists or if the default `biome check` config matches project conventions.

## Current state

### OTP validation mismatch

`src/lib/validations.ts:4,20`:
```typescript
otp: z.string().length(4, "OTP must be 4 digits"),
```

`src/lib/otp.ts:28`:
```typescript
return Math.floor(100000 + Math.random() * 900000).toString();
// Always 6 digits (100000–999999)
```

### Usage of `@supabase/supabase-js` and `resend`

```bash
grep -r "@supabase/supabase-js" src/  # → no matches
grep -r "resend" src/                  # → no matches
grep -r "Supabase\|createClient" src/  # → no matches
```

Both packages are unused. Nodemailer handles email sending.

### Duplicate bank routes

| Route | Endpoint called | Notes |
|-------|----------------|-------|
| `bank-codes/route.ts` | `nombaGet("/v1/transfers/banks")` | Extracts `data` property, wraps in `{ banks }` |
| `transfers/banks/route.ts` | `nombaGet("/v1/transfers/banks")` | Returns raw response, no data extraction |
| `bank-lookup/route.ts` | `nombaPost("/v1/transfers/bank/lookup")` | Includes success message string |
| `transfers/bank-lookup/route.ts` | `nombaPost("/v1/transfers/bank/lookup")` | No success message |
| `bank-search/route.ts` | (unknown) | Need to check |

### Biome config

Check if `biome.json` or `biome.jsonc` exists at project root.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npx tsc --noEmit` | exit 0, no errors |
| Lint | `npx biome check src/` | exit 0 |
| Test | `npm t` | exit 0 |
| Install | `npm install` | exit 0, no warnings |

## Scope

**In scope**:
- `src/lib/validations.ts` — fix OTP length from 4 to 6
- `package.json` — remove `@supabase/supabase-js` and `resend`
- `src/app/api/v1/bank-codes/route.ts` — DELETE (redundant with transfers/banks)
- `src/app/api/v1/bank-lookup/route.ts` — DELETE (redundant with transfers/bank-lookup)
- `src/app/api/v1/bank-search/route.ts` — REVIEW: keep only if unique from transfers routes
- `biome.json` — CREATE (if it doesn't exist, with reasonable defaults)
- `.gitignore` — ensure `biome.json` is tracked

**Out of scope**:
- Frontend references to the deleted bank routes (check `src/lib/api.ts` for the API client)
- Changing the OTP generation logic (6 digits is fine — the validation was wrong)

## Steps

### Step 1: Fix OTP validation length

In `src/lib/validations.ts`, change both occurrences:

Line 4: `z.string().length(4, "OTP must be 4 digits")` → `z.string().length(6, "OTP must be 6 digits")`
Line 20: same change.

**Verify**: `grep -n "length.*OTP" src/lib/validations.ts` → `.length(6, "OTP must be 6 digits")`.

### Step 2: Remove dead dependencies

In `package.json`, remove these lines from `dependencies`:
```json
"@supabase/supabase-js": "^2.110.0",
"resend": "^6.17.1",
```

Then run `npm install` to update `package-lock.json`.

**Verify**: `grep -c "supabase\|resend" package.json` → 0. `npm install` → exit 0. `npx tsc --noEmit` → exit 0.

### Step 3: Delete duplicate bank routes

Delete:
- `src/app/api/v1/bank-codes/route.ts`
- `src/app/api/v1/bank-lookup/route.ts`

Check `src/app/api/v1/bank-search/route.ts` — if it calls a different endpoint or provides unique functionality, keep it; otherwise delete too.

Before deleting, check `src/lib/api.ts` for client-side references to these routes:

```bash
grep -n "bank-codes\|bank-lookup\|bank-search" src/lib/api.ts
```

If the client uses the deleted paths, update the references to point to the `transfers/` equivalents.

**Verify**: `ls src/app/api/v1/bank-codes/route.ts` → "No such file". `ls src/app/api/v1/bank-lookup/route.ts` → "No such file". `npx tsc --noEmit` → exit 0.

### Step 4: Create `biome.json` (if it doesn't exist)

Check if `biome.json` exists. If not, create:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "warn",
        "noUnusedImports": "error"
      },
      "style": {
        "noNonNullAssertion": "off"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  },
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  }
}
```

**Verify**: `ls biome.json` → file exists. `npx biome check src/` → runs without error (may have warnings on existing code).

### Step 5: If Biome config was added, format

```bash
npx biome format --write src/
```

Only if the project previously lacked a `biome.json` and relied on defaults — skip if the project already had a biome config that was being used.

## Test plan

- Run `npm t` → all tests pass.
- Run `npx tsc --noEmit` → exit 0.
- Manual: Start dev server, verify `/api/v1/auth/login` works with 6-digit OTP (use the dev console log `[DEV] OTP for ...`).
- Manual: Verify `GET /api/v1/transfers/banks` still works (the kept canonical route).
- Manual: Verify wallet withdrawal page still resolves bank names (it uses the `transfers/` endpoint in the actual code).

## Done criteria

- [ ] `npm install` exits 0 without errors
- [ ] `npx tsc --noEmit` exits 0
- [ ] `grep "length.*4.*OTP\|OTP.*4" src/lib/validations.ts` → no matches
- [ ] `grep "length.*6.*OTP\|OTP.*6" src/lib/validations.ts` → at least 2 matches
- [ ] `grep -c "supabase\|resend" package.json` → 0
- [ ] `src/app/api/v1/bank-codes/route.ts` and `bank-lookup/route.ts` no longer exist
- [ ] Client-side API calls still work (check `src/lib/api.ts` references updated)
- [ ] No files outside the in-scope list are modified

## STOP conditions

- If deleting the duplicate bank routes breaks any page (check `grep` in `src/app/` for `"/bank-codes"` or `"/bank-lookup"`) — stop and update the frontend references before deleting.
- If `resend` or `@supabase/supabase-js` is imported anywhere that wasn't caught by the initial grep — stop and preserve the dependency.
- If `biome.json` already exists with custom rules, do NOT overwrite it — skip Step 4.
- A verification command fails twice after a reasonable fix attempt.

## Maintenance notes

- The OTP length (6 digits) is now consistent across validation, generation, and the DB schema (`otpCodes.otp` is `varchar` — can hold any length).
- The canonical bank endpoints are now solely at `/api/v1/transfers/banks` and `/api/v1/transfers/bank-lookup`. Any future bank routes should go in the `transfers/` subdirectory.
- `@supabase/supabase-js` and `resend` were removed as dead weight. If Supabase is needed in the future, re-add it.
