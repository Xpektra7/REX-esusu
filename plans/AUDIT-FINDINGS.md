# Audit Findings — Esusu (REX-esusu)

Generated: 2026-07-09 · Commit: `279fc5d`

---

## Fixed / Resolved Since Prior Audit (`5f2709d`)

| Finding | Reason |
|---------|--------|
| F1 — Mock wallet shape mismatch | Mock now returns `{balanceKobo, virtualAccount, pendingReconciliationKobo}` — matches live route |
| F2 — Mock circles bare array | Mock now returns `{ circles: [...] }` — matches live route shape |
| F3 — Withdraw race condition | Fixed via atomic `sql\`balance_kobo - ${amount}\`` + `gte` check |
| F4 — Contributions initiate race condition | Same atomic pattern fix |
| F5 — PII in URL query params | Removed from new signin/signup pages; stale `/auth` to be deleted |
| F6 — PIN verify no rate limiting | `verify-pin/route.ts` has DB-level lockout (5/10/15 attempts via `loginAttempts`/`lockedUntil`) |
| F7 — In-memory OTP Map | Now DB-backed (`otpCodes` table) |
| F8 — Logout no clearAuth | Profile page now uses `ActionPinDialog` + `api.auth.logout()` + `clearAuth()` |
| F9 — KYC simulates BVN locally | New `/signup/bvn` page calls `api.auth.verifyBvn()`; stale `/auth/kyc` to be deleted |
| F10 — Mock snake_case | All mock responses now use camelCase (`needs_bvn`→`needsBvn`, etc.) |
| F14 — No .env.example / --webpack | `.env.example` exists; `next dev` uses Turbopack (no `--webpack`) |
| F24 — Notification.readAt vs read | `type/index.ts` has `read: boolean` — matches DB schema |
| F25 — Debt missing fineKobo | `Debt.fineKobo: number` is present in types |
| F27 — cycle_id snake_case in Zod | `contributionSchema` uses `cycleId: z.string().uuid()` — camelCase |

---

## 🔴 HIGH — New & Unfixed

### H-01 Top-up reconciliation: misdirected gate blocks legitimate payments + double-credit
- **Evidence**: `src/lib/reconciliation.ts:67-133` — `classifyPayment()` (lines 44-54) returns `"misdirected"` when `expected <= 0` (no dues → pure top-up) or ratio < 0.5 / > 1.5. Lines 69-83 credit **full** `actual` to `balance_kobo` immediately, then lines 135-148 run FIFO debt-clearing + cycle allocation on the same amount (these functions write `debts`/`contributions`/`cycles` rows but never debit balance). Result: **double-credit** (balance += full amount AND contribution rows for the full amount).
- **Also**: notification at line 612 uses `txn.transactionAmount / 100` (double-divide: Nomba sends naira, confirmed by docs `walletBalance: 539.4`, `transactionAmount: 120`). With the sample payload `120`, this prints "1.2N" instead of "120N". Fix: `actual / 100`.
- **Impact**: Pure top-ups flagged as misdirected. Contributions double-counted in user's wallet balance. All notification amounts on misdirected path are 1/100th of real value.
- **Effort**: M
- **Risk**: MED — changing the early-credit logic; test coverage required
- **Confidence**: HIGH

### H-02 No page-level auth guard (proxy.ts dead, cookie spoofable)
- **Evidence**: `src/proxy.ts` exports `proxy()` but **no `export function middleware`** — it is never loaded. Grep confirms zero imports of `proxy.ts`. No `src/middleware.ts` exists. The only auth cookie (`esusu-auth=true`) is set client-side at `src/stores/auth-store.ts:88` with no `HttpOnly`/`Secure`/`SameSite=Strict`. Any visitor can set `esusu-auth=true` and reach "protected" routes.
- **Impact**: All page-level route protection is non-functional and trivially spoofable.
- **Effort**: M (promote proxy.ts to real middleware, set cookie server-side)
- **Risk**: MED — middleware runs on every request; testing needed
- **Confidence**: HIGH

### H-03 BVN verification endpoint is open + returns fake PII
- **Evidence**: `src/app/api/v1/auth/verify-bvn/route.ts:3-22` — POST handler accepts any 11-digit BVN, returns hardcoded `{ name: "Chioma Okafor", dob: "15-03-1990" }` with no `requireAuth` import or check.
- **Impact**: Unauthenticated caller can "verify" arbitrary BVNs; KYC/AML integrity bypassed.
- **Effort**: S (add `requireAuth`, wire real NIBSS/Nomba lookup, or return `code:"05"` until wired)
- **Risk**: HIGH — KYC compliance for a fintech
- **Confidence**: HIGH

### H-04 JWT signed/verified with empty-secret fallback, no algorithm pinning
- **Evidence**: `src/lib/auth.ts:8` — `const JWT_SECRET = process.env.JWT_SECRET || ""`. `verifyToken` (line 19-25) calls `jwt.verify(token, JWT_SECRET)` with no `{ algorithms: ["HS256"] }` option. If `JWT_SECRET` is unset, tokens verify against empty string.
- **Impact**: Secret misconfiguration yields full auth bypass (forge `userId`/`email` claims).
- **Effort**: S (throw if empty, pin algorithms)
- **Risk**: HIGH — full auth bypass
- **Confidence**: HIGH

---

## 🟡 MEDIUM — New & Unfixed

### M-01 No API rate limiting on auth/OTP/withdraw endpoints
- **Evidence**: Grep for `rateLimit|rate-limit|ratelimit` across `src/` returns zero matches. `send-otp`, `verify`, `verify-pin`, `change-pin`, `wallet/withdraw` routes have no throttling.
- **Impact**: OTP/brute-force at scale, spam OTP emails, withdrawal abuse.
- **Effort**: M (add IP+account rate limiter middleware or per-route helper)
- **Risk**: MED — improves brute-force resistance
- **Confidence**: HIGH

### M-02 Refresh token = access token, no revocation/jti
- **Evidence**: `src/app/api/v1/auth/refresh/route.ts:5-16` — takes refresh token, calls `verifyToken`, issues new access token. Both access and refresh tokens are identical (`src/app/api/v1/auth/verify/route.ts:124-125` both `signToken(...)`). No `jti`, no revocation list, no rotation.
- **Impact**: Leaked refresh token is valid forever; no way to revoke stolen tokens.
- **Effort**: M (separate short-lived access vs long-lived refresh with DB-stored jti + rotation)
- **Risk**: MED — token theft persistence
- **Confidence**: HIGH

### M-03 Webhook acks 200 on signature/parse failure
- **Evidence**: `src/app/api/v1/webhooks/nomba/route.ts:91-96` — the outer `catch` (which covers signature verification and JSON parse) returns `{ code: "00", description: "Received" }` (HTTP 200). Any processing failure is acknowledged as success.
- **Impact**: Malformed payloads disguised as accepted; reconciliation blind spot for money movement.
- **Effort**: S (return 4xx on verification/parse failure, reserve 200 for verified+queued)
- **Risk**: MED — money-movement correctness
- **Confidence**: HIGH

### M-04 OTP logged in plaintext (dev), raw error messages sent to clients
- **Evidence**: `src/lib/otp.ts:34` — `console.log(\`[DEV] OTP for ${email}: ${otp}\`)` runs when SMTP is not configured. Multiple routes return `error((e as Error).message)` verbatim (e.g. `wallet/withdraw/route.ts:113`, `verify-pin/route.ts:54`).
- **Impact**: OTP leakage in logs (any env without SMTP). Internal error details exposed to clients.
- **Effort**: S (remove OTP console.log, return generic error strings)
- **Risk**: MED — info disclosure
- **Confidence**: HIGH

### M-05 Wallet transaction history: mock/live contract mismatch + incomplete coverage
- **Evidence**: `src/app/api/v1/wallet/transactions/route.ts:33-44` returns semantic type (`"topup"`, `"withdrawal"`, `"debt_payment"`) with **no `description`** field. But `src/app/(dashboard)/wallet/page.tsx:26-35` defines `WalletTransaction` with `type: "credit" | "debit"` **and** expects `description` (line 159: `DiceBearAvatar name={tx.description}`, line 152: `isCredit = tx.type === "credit"`). `src/lib/api.ts:543-590` mock returns `credit`/`debit` + description, so it **works in mock, breaks in prod**: all rows render as debit with `undefined` label. The `WalletTransaction` type in `src/types/index.ts:124-133` also says `"credit"|"debit"`.
- **Additionally**: Only `topup` and `debt_payment` types are written to `wallet_transactions`. **Withdrawals** (`wallet/withdraw/route.ts`) never write a `wallet_transactions` row — they're invisible in both wallet history and `/activity` feed. Contributions (separate `contributions` table) and payouts (separate `payout_transactions`) also don't appear in the dedicated wallet history (only in `/activity`).
- **Impact**: Wallet transaction page shows incomplete, mislabeled data in production. Withdrawals invisible to user.
- **Effort**: M (normalize response shape, add description/direction to live route; write wallet_transactions on withdrawal)
- **Risk**: LOW — purely cosmetic + missing data
- **Confidence**: HIGH

---

## 🟡 MEDIUM — Existing Unfixed (from prior audit)

### E-01 `src/lib/api.ts` is ~1300 lines — god file
- **Evidence**: `src/lib/api.ts` — mock handlers, request core, and API surface all in one file. Mock portion is ~400 lines.
- **Impact**: Hard to maintain/test; changes risk breaking unrelated mocks or the request pipeline.
- **Effort**: M (extract mock handlers to `src/lib/api-mock.ts`)
- **Risk**: LOW — mechanical extract, tests verify
- **Confidence**: HIGH
- *(Was F11)*

### E-02 `src/lib/reconciliation.ts` is ~600 lines — tangled concerns
- **Evidence**: `src/lib/reconciliation.ts` — webhook payment reconciliation + FIFO debt clearing + cycle closure logic all in one module.
- **Impact**: Hard to reason about and test in isolation; cycle closure is a separate concern.
- **Effort**: M (extract cycle closure to `src/lib/cycle-closure.ts`)
- **Risk**: LOW — mechanical extract with existing test coverage
- **Confidence**: HIGH
- *(Was F12)*

### E-03 52 Biome lint errors
- **Evidence**: `npx biome check src/` reports 52 errors (improved from 218 in prior audit, but still present). Mostly formatting/ordering.
- **Impact**: CI noise; real issues hidden among formatting warnings.
- **Effort**: S (run `npx biome check --write src/`)
- **Risk**: LOW — auto-fixable
- **Confidence**: HIGH
- *(Was F13, updated count)*

### E-04 `date-fns` in `package.json` dependencies, never imported
- **Evidence**: `rg -c "date-fns" src/` returns 0 matches. Listed in `package.json:42`.
- **Impact**: 60KB+ dead dep in production bundle.
- **Effort**: S (remove from `dependencies`)
- **Risk**: LOW — affects only tree-shaking if unused
- **Confidence**: HIGH
- *(Was F15)*

### E-05 `shadcn` CLI in `dependencies` (should be `devDependencies`)
- **Evidence**: `package.json:57` — `"shadcn": "^4.12.0"` under `dependencies`.
- **Impact**: Unnecessary production dep; minor bundle/security concern.
- **Effort**: S (move to `devDependencies`)
- **Risk**: LOW
- **Confidence**: HIGH
- *(Was F16)*

### E-06 Auth pages (OTP, PIN) use raw `async/await` + `useState` instead of `useMutation`
- **Evidence**: `src/app/(auth)/signin/page.tsx`, `signup/page.tsx`, and OTP/PIN pages use `@tanstack/react-form` with `async/await` in `onSubmit`. No `useMutation` for loading/error state management.
- **Impact**: Pattern inconsistency; missing loading/error states at framework level.
- **Effort**: S (wrap API calls in `useMutation`)
- **Risk**: LOW — style only
- **Confidence**: MED
- *(Was F17)*

### E-07 `src/lib/supabase.ts` dead code — never imported
- **Evidence**: `rg -l "supabase" src/ --include='*.ts' --include='*.tsx'` returns no hits outside `supabase.ts` itself.
- **Impact**: Dead code; confusing to developers.
- **Effort**: S (delete the file)
- **Risk**: LOW
- **Confidence**: HIGH
- *(Was F18)*

### E-08 Duplicate status badge patterns
- **Evidence**: Near-identical badge components across `cycle-badge.tsx`, `debt-badge.tsx`, `status-badge.tsx`, plus inline in `member-list.tsx`.
- **Impact**: Inconsistency drifts over time; 4x the maintenance surface.
- **Effort**: S (consolidate into one `StatusBadge` component)
- **Risk**: LOW
- **Confidence**: MED (needs re-verification of current file paths)
- *(Was F19)*

### E-09 Duplicate progress bar markup
- **Evidence**: `hero-pot-card.tsx` + `recipient-hero-card.tsx` share nearly identical progress bar markup.
- **Impact**: Changes must be made in two files.
- **Effort**: S (extract `ProgressBar` component)
- **Risk**: LOW
- **Confidence**: MED (needs re-verification of current file paths)
- *(Was F20)*

### E-10 Date formatting duplicated inline at 5+ sites
- **Evidence**: Multiple components call `.toLocaleDateString()` with identical options inline.
- **Impact**: Format changes require editing every site.
- **Effort**: S (add `formatDate()` helper to `src/lib/utils.ts`)
- **Risk**: LOW
- **Confidence**: MED
- *(Was F21)*

### E-11 Duplicate empty state patterns
- **Evidence**: Some pages use `<Card>`, others use plain `<div>` for empty states, with/without icons.
- **Impact**: Visual inconsistency.
- **Effort**: S (use the `Empty` shadcn component everywhere)
- **Risk**: LOW
- **Confidence**: MED
- *(Was F22)*

### E-12 Duplicate bank route handlers
- **Evidence**: `src/app/api/v1/bank-codes/route.ts` AND `src/app/api/v1/transfers/banks/route.ts` both fetch bank lists from Nomba but return different response shapes. Same for `bank-lookup` vs `transfers/bank-lookup`.
- **Impact**: Contract drift risk; maintainers must update both.
- **Effort**: S (pick one canonical route, deprecate the other)
- **Risk**: LOW — check no caller uses the deprecated shape
- **Confidence**: HIGH
- *(Was F23)*

### E-13 Zero frontend/component tests
- **Evidence**: No test files under `src/`. Only 3 test files exist: `scripts/reconciliation.test.ts`, `scripts/reconciliation.integration.test.ts`, `scripts/e2e-api.test.ts`.
- **Impact**: Auth flows, wallet UI, circle management have no automated coverage.
- **Effort**: L (requires component test setup + coverage for critical paths)
- **Risk**: LOW
- **Confidence**: HIGH
- *(Was F26, updated count)*

---

## 🔵 LOW — New Findings

### L-01 OTP schema length mismatch
- **Evidence**: `src/lib/validations.ts:4,20` — `otpSchema` and `signupSchema` say `"OTP must be 4 digits"` (`.length(4, ...)`). But `src/lib/otp.ts:28` generates a **6-digit** OTP (`Math.floor(100000 + Math.random() * 900000)`) and `InputOTP maxLength={6}` uses 6 slots.
- **Impact**: If the Zod schemas are ever enforced server-side, valid 6-digit OTPs would be rejected.
- **Effort**: S (change `.length(4)` → `.length(6)` in both schemas)
- **Risk**: LOW
- **Confidence**: HIGH

---

## Considered & rejected

- `@tanstack/react-form` used only on auth pages — accepted as intentional (auth is the most complex form, and it's used consistently there).
- `strict: true` + no `@ts-ignore` — excellent discipline, not a finding.
- `walletTransactionAmount * 100` unit conversion — after analyzing Nomba's own example payload (`walletBalance: 539.4`, `transactionAmount: 120`, `fee: 0.6` — all in naira major units), confirmed the `* 100` is correct. The bug is only in the notification's double-divide (`/ 100` on an already-naira value). Not a finding.
