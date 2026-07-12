# Transaction System Audit

Captured 2026-07-10 while investigating a top-up/reconciliation report and a
dashboard runtime crash. These are the **issues** with the current transaction
model. The proposed solutions live in the transaction-rework plan
(`plans/transaction-rework.md` — see summary at end). Severity: H = blocks the
core product model, M = correctness/UX gap, L = hardening.

---

## H-1. Contributions are not paid from the wallet
- **Current:** A contribution is created only when money arrives in a virtual
  account via Nomba webhook and is matched by amount/reference in
  `reconcilePayment` (`src/lib/reconciliation.ts:57`). The wallet (`virtualAccounts.balanceKobo`)
  is just a passive store; there is no "Pay contribution" action that debits it.
- **Desired (product direction):** Money lives in the wallet independently of
  circles. Paying a contribution **debits the wallet** (internal transaction),
  exactly like a withdrawal already does (`src/app/api/v1/wallet/withdraw/route.ts:31`).
- **Why it matters:** The data model already expects this — `walletTransactions.type`
  includes `"contribution"` and `"payout"` (`src/app/api/v1/activity/route.ts` CASE),
  and the `autoPay` label literally says *"Auto-debit from wallet when contribution
  is due."* The implementation never caught up.

## H-2. Payment references (`CONTRIB_…`) are generated and matched
- **Current:** `src/app/api/v1/contributions/initiate/route.ts` generates
  `ourReference = CONTRIB_${circleId}_${cycleNumber}_${userId}_${ts}`; the webhook
  matches incoming transfers to it via `extractReference` (`src/lib/reconciliation.ts:175`)
  and `contributions/confirm` re-matches by it.
- **Desired:** Kill reference generation/matching entirely. Top-ups are wallet
  funding; contributions are internal wallet debits — neither needs a payment
  reference the user must copy into a bank-transfer narration.
- **Files:** `contributions/initiate/route.ts`, `contributions/confirm/route.ts`,
  `src/lib/reconciliation.ts`, `src/db/schema.ts` (`our_reference` column → unused).

## H-3. `autoPay` is a dead settings flag
- **Current:** `auto_pay` column exists (`src/db/schema.ts`), the toggle UI exists
  (`src/components/settings/auto-pay-toggle.tsx`), but there is **no logic** — the
  settings page renders it as *"Coming soon"* (`src/app/(dashboard)/settings/page.tsx`).
- **Desired:** When a member is due and `autoPay` is on with sufficient wallet
  balance, the contribution is auto-debited (via a cron route). Otherwise the
  member pays manually with a "Pay" button; if unpaid past grace → debt.

## H-4. Payout disburses to bank, not wallet
- **Current:** Payout calls Nomba `/v2/transfers/bank` to push to the recipient's
  bank (`src/app/api/v1/circles/[id]/cycles/[cycleNumber]/payout/route.ts:93`).
- **Desired (product direction):** Payout **credits the recipient's wallet**
  (`balanceKobo += amount`, `walletTransactions` type `payout`). The member then
  withdraws to bank when they want. Removes the Nomba disbursement dependency for
  payouts.

---

## M-1. Top-up still generates a payment reference
- **Current:** `src/app/api/v1/wallet/topup/route.ts` returns a `reference` and the
  top-up page shows *"Payment reference generated"* + copy button
  (`src/app/(dashboard)/wallet/topup/page.tsx`).
- **Desired:** Top-up is funded by **card (Nomba checkout)** or **bank transfer**
  to the VA. No reference. Bank-transfer top-up is matched purely by VA, not
  reference.

## M-2. No card processor for top-ups
- **Current:** Only Nomba is integrated, and only for bank transfer (VA) + bank
  disbursement. No card path exists.
- **Desired:** Card top-up via Nomba Online Checkout (`POST /v1/checkout/order` →
  `checkoutLink`, webhook confirms) — verified available in Nomba docs. Uses the
  hosted-redirect flow (no direct card capture → avoids PCI scope).

## M-3. `misdirected` / `overpayment` classification is too broad
- **Current:** `classifyPayment` (`src/lib/reconciliation.ts:45`) returns
  `"misdirected"` whenever expected dues = 0 (i.e. any clean wallet top-up) and
  `"overpayment"` in a 1.01–1.5× band. So a normal top-up gets flagged
  "Misdirected payment flagged" even though it credits fine.
- **Status:** The pure-top-up false-flag was already fixed this session
  (`reconciliation.ts` — `totalExpected <= 0 && !ourRef → "topup"`), and a
  "Top-up received" confirmation notification was added. Remaining: after the
  rework, contribution classification is removed entirely; `overpayment` becomes
  N/A for top-ups (drop it) and `misdirected` is kept only for the orphan case
  (transfer to a VA we can't match) — i.e. it "should only be hit once in a while."

## M-4. Webhook couples contributions + top-ups
- **Current:** The Nomba webhook (`src/app/api/v1/webhooks/nomba/route.ts:118`)
  routes `payment_success` → `reconcilePayment`, which both allocates to cycles/
  debts AND credits top-up remainder. Contributions and top-ups are intertwined.
- **Desired:** After rework, the webhook only handles **top-up bank transfers**
  (credit wallet). Contributions are internal; payout webhook handlers become unused.

---

## L-1. Dashboard "Recent Activity" crashes on live data (FIXED)
- **Symptom:** `Uncaught TypeError: Cannot read properties of undefined (reading 'bg')`
  inside an `Array.map` (dashboard load).
- **Root cause:** `iconMap[item.type]` in `src/app/(dashboard)/dashboard/page.tsx:174`
  had **no fallback**. The live activity route prefixes every type with `wallet_`
  (`type: 'wallet_' + walletTransactions.type`, `src/app/api/v1/activity/route.ts:24`),
  so live types are `wallet_topup` / `wallet_withdrawal` / `wallet_contribution` /
  `wallet_payout` — none match the unprefixed `iconMap` keys → `meta` undefined →
  `meta.bg` throws. (Mock mode was safe because it returns the bare keys.)
- **Fix applied:** Normalize the `wallet_` prefix, widen `iconMap` to
  `Record<string, …>`, add a `withdrawal` entry, and add a default-icon fallback
  (`activityMeta()`). The other two `.bg` sites (`notifications/page.tsx:201`,
  `right-panel.tsx:133`) already had fallbacks.

## L-2. `ourReference` column will be orphaned
- After H-2, `contributions.our_reference` is no longer written. Column can stay
  (nullable, unused) to avoid a migration; stop writing it. Existing rows keep
  their value.

## L-3. Payout webhook handlers become dead code
- `handlePayoutSuccess` / `handlePayoutFailed` (`src/lib/payout.ts`) only matter
  while payouts disburse via Nomba. After H-4 they are unused — remove or keep as
  no-op during cleanup.

---

## Affected files (summary)
- `src/lib/reconciliation.ts` — strip to top-up-only crediting + orphan; remove
  contribution classification / reference matching.
- `src/lib/payout.ts` — internal wallet credit instead of Nomba disbursement.
- `src/app/api/v1/wallet/topup/route.ts` — remove reference; add card endpoint.
- `src/app/api/v1/contributions/initiate/route.ts` → `contributions/pay` (wallet debit).
- `src/app/api/v1/contributions/confirm/route.ts` — remove reference matching.
- `src/app/api/v1/circles/[id]/cycles/[cycleNumber]/payout/route.ts` — credit wallet.
- `src/app/api/v1/api/cron/autopay/route.ts` — NEW.
- `src/app/api/v1/webhooks/nomba/route.ts` — top-up only.
- `src/lib/nomba.ts` — checkout/order helper.
- `src/app/(dashboard)/dashboard/page.tsx` — activity icon fallback (DONE).
- `src/app/(dashboard)/wallet/topup/page.tsx` — card + bank tabs.
- `src/app/(dashboard)/circles/[id]/page.tsx` — "Pay" button.
- `src/lib/api.ts` — mock: topup (no ref), contributions.pay, drop confirm.

## Solution plan (one line)
Wallet-centric rework: top-up (card/bank) → wallet; contributions debit wallet;
payout credits wallet; kill references; auto-pay via cron; misdirected/overpayment
become rare edge cases. See `plans/transaction-rework.md`.
