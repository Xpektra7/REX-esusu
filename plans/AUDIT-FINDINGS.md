# Audit Findings — Esusu (REX-esusu)

Generated: 2026-07-03 · Commit: `5f2709d`

---

## 🔴 HIGH

- [ ] **F1** — Mock `GET /wallet` returns `{balance, transactions}` but live API returns `{balanceKobo, virtualAccount, pendingReconciliationKobo}` (`src/lib/api.ts:499-533`). Wallet shows ₦0 in mock mode.
- [ ] **F2** — Mock `GET /circles` returns bare array, frontend expects object (`src/lib/api.ts:226-255`). Circles list silently empty in mock mode.
- [ ] **F3** — `wallet/withdraw` reads balance, checks, then writes in separate statements (`src/app/api/v1/wallet/withdraw/route.ts:26-60`). Race condition allows over-withdrawal.
- [ ] **F4** — `contributions/initiate` same read-then-write pattern (`src/app/api/v1/contributions/initiate/route.ts:41-49`). Race condition on contributions.
- [ ] **F5** — Name + email exposed in URL query params from auth → OTP (`src/app/(auth)/auth/page.tsx:69-72`). PII in browser history/server logs.
- [ ] **F6** — PIN verify has no server-side rate limiting (`src/app/api/v1/auth/verify-pin/route.ts:14-23`). Brute-force via direct API calls.
- [ ] **F7** — OTP stored in-memory `Map` (`src/lib/otp.ts:12`). Auth broken in multi-instance/serverless deployments.
- [ ] **F8** — "Log Out" just navigates to `/auth` without `clearAuth()` or `api.auth.logout()` (`src/app/(dashboard)/profile/page.tsx:175`). Tokens remain in localStorage.
- [ ] **F9** — KYC page simulates BVN locally instead of calling `api.auth.verifyBvn()` (`src/app/(auth)/auth/kyc/page.tsx:51-78`). BVN compliance non-functional in live mode.

---

## 🟡 MEDIUM

- [ ] **F10** — Mock uses snake_case (`bvn_last4`, `needs_bvn`, `refresh_token`) but live API returns camelCase (`bvnLast4`, `needsBvn`, `refreshToken`). Affects `src/lib/api.ts` + `src/stores/auth-store.ts:28-33`.
- [ ] **F11** — `src/lib/api.ts` is 931 lines — mock data, request core, and API surface all in one file.
- [ ] **F12** — `src/lib/reconciliation.ts` is 598 lines — webhook reconciliation + cycle closure tangled.
- [ ] **F13** — 218 Biome errors (`npm run lint`). Never auto-fixed. CI noise.
- [ ] **F14** — No `.env.example`, no pre-commit hooks, `--webpack` flag instead of Turbopack in `package.json`.
- [ ] **F15** — `date-fns` in `package.json` dependencies but never imported in `src/`. 60KB+ dead dep.
- [ ] **F16** — `shadcn` CLI in `dependencies` (should be `devDependencies`).
- [ ] **F17** — Auth pages (OTP, PIN) use raw `async/await` + `useState` instead of `useMutation`. Violates UI-RULES.md.
- [ ] **F18** — `src/lib/supabase.ts` dead code — never imported anywhere.

---

## 🔵 LOW

- [ ] **F19** — Duplicate status badges (4 near-identical patterns: `cycle-badge.tsx`, `debt-badge.tsx`, `status-badge.tsx`, inline in `member-list.tsx`).
- [ ] **F20** — Duplicate progress bar markup in `hero-pot-card.tsx` + `recipient-hero-card.tsx`.
- [ ] **F21** — Date formatting duplicated inline at 5+ sites.
- [ ] **F22** — Duplicate empty state patterns (Card vs div, with/without icon).
- [ ] **F23** — Duplicate route handlers (`/bank-codes` + `/transfers/banks`, `/bank-lookup` + `/transfers/bank-lookup`).
- [ ] **F24** — `Notification` type has `readAt` but schema has `read` boolean — will break when live notifications connect.
- [ ] **F25** — `Debt` type missing `fineKobo` field present in DB schema.
- [ ] **F26** — Zero frontend/component tests. Only 2 integration test files for reconciliation.
- [ ] **F27** — `cycle_id` snake_case in Zod schema (`src/lib/validations.ts:121`). Naming convention violation.

---

## Considered & rejected

- In-memory OTP Map (F7) — reported as HIGH. The `otp_whitelist` env var for test accounts doesn't solve production multi-instance.
- `@tanstack/react-form` used only on auth page — accepted as intentional (auth is the most complex form).
- `strict: true` + zero `@ts-ignore` — excellent discipline, no finding.
