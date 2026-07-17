# Plan 013: Fix OTP length mismatch (4 vs 6 digits)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat e041804..HEAD -- src/lib/otp.ts src/lib/validations.ts src/lib/api.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `e041804`, 2026-07-17

## Why this matters

The OTP generator produces 6-digit codes but validation expects exactly 4 digits. All OTP verification attempts will fail in production because the Zod schema rejects valid 6-digit codes. This completely breaks signup, login, password reset, and any flow that uses OTP verification.

## Current state

- `src/lib/otp.ts:28`: `Math.floor(100000 + Math.random() * 900000).toString()` produces a 6-digit string (100000-999999)
- `src/lib/validations.ts:4`: `z.string().length(4, "OTP must be 4 digits")` — requires exactly 4 characters
- `src/lib/validations.ts:20`: Same validation for signup OTP
- `src/lib/validations.ts:41`: Same validation for password reset OTP
- `src/lib/api.ts:917`: `String(body.otp).length < 4` — would accept 6 digits, but Zod rejects before this check

Convention: Zod schemas in `src/lib/validations.ts` are the canonical validation layer. The `api.ts` length checks are secondary.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Lint      | `npx biome check .`      | exit 0              |

## Scope

**In scope**:
- `src/lib/validations.ts` — change OTP length from 4 to 6 in all 3 schemas
- `src/lib/api.ts` — update OTP length check from < 4 to !== 6

**Out of scope**:
- Do NOT change the OTP generator (`src/lib/otp.ts`) — it already produces correct 6-digit codes
- Do NOT change any other validation rules
- Do NOT change any frontend OTP input fields (they should already accept 6 digits — verify)

## Steps

### Step 1: Fix Zod validation schemas

In `src/lib/validations.ts`, change all 3 OTP validation rules:

Line 4 (sign-in OTP):
```diff
- otp: z.string().length(4, "OTP must be 4 digits"),
+ otp: z.string().length(6, "OTP must be 6 digits"),
```

Line 20 (signup OTP):
```diff
- otp: z.string().length(4, "OTP must be 4 digits"),
+ otp: z.string().length(6, "OTP must be 6 digits"),
```

Line 41 (forgot-password OTP):
```diff
- otp: z.string().length(4, "OTP must be 4 digits"),
+ otp: z.string().length(6, "OTP must be 6 digits"),
```

**Verify**: `npx tsc --noEmit` exits 0. `grep 'length(4, "OTP"' src/lib/validations.ts` returns no matches.

### Step 2: Fix API client OTP check

In `src/lib/api.ts` line 917:
```diff
- if (!body.otp || String(body.otp).length < 4) {
+ if (!body.otp || String(body.otp).length !== 6) {
```

**Verify**: `npx tsc --noEmit` exits 0.

### Step 3: Verify frontend OTP input accepts 6 digits

Search frontend OTP input components for maxLength or pattern attributes:
```bash
grep -rn "otp" src/components/ --include="*.tsx" --include="*.ts"
grep -rn "maxLength.*4\|maxlength.*4" src/components/ --include="*.tsx"
```

If any OTP input has `maxLength={4}` or `maxlength="4"`, change to `maxLength={6}`.

**Verify**: Frontend OTP inputs accept 6 digits without error.

## Test plan

Manual verification:
1. Request OTP for a test email — confirm email/console shows a 6-digit code
2. Enter the 6-digit code in the OTP input — confirm verification succeeds
3. Enter a 4-digit code — confirm validation error "OTP must be 6 digits"
4. Enter letters or special characters — confirm Zod type validation rejects them

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `grep 'length(4, "OTP"' src/lib/validations.ts` returns no matches
- [ ] `grep '\.length < 4' src/lib/api.ts` returns no matches
- [ ] Signup OTP flow works end-to-end with 6-digit codes
- [ ] Sign-in OTP flow works end-to-end with 6-digit codes
- [ ] Forgot-password OTP flow works end-to-end with 6-digit codes
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- The OTP generator in `src/lib/otp.ts` doesn't produce 6-digit codes — check `generateOtp()`
- The frontend OTP inputs have hardcoded 4-digit formatting (separate input boxes per digit)
- Any schema in `validations.ts` uses `length(4)` for something other than OTP (e.g., PIN)

## Maintenance notes

- If OTP length ever changes again, update both the generator AND all validations — they must stay in sync.
- The OTP is stored as a plain string in the database. Consider hashing it if replay attacks become a concern.
