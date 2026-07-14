# Plan 001: Fix top-up reconciliation — remove misdirected gate, eliminate double-credit

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 279fc5d..HEAD -- src/lib/reconciliation.ts src/lib/validations.ts src/types/index.ts scripts/reconciliation.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `279fc5d`, 2026-07-09

## Why this matters

The `reconcilePayment` function has two interacting bugs that break wallet funding:

1. **Double-credit**: The full `actual` amount is credited to `balance_kobo` immediately (line 74), THEN FIFO debt-clearing + cycle allocation runs on the same amount — those functions write `contributions`/`cycles`/`debts` rows but never debit balance. Result: balance = +`actual` AND contributions = +`actual` for any payment with dues.

2. **Misdirected gate blocks legitimate top-ups**: `classifyPayment` (line 50) returns `"misdirected"` when `expected <= 0` (no active dues — pure top-up) or ratio < 0.5 / > 1.5. The early return at line 131 then flags the payment. Money was already credited (see #1), but the user gets a confusing "Misdirected payment" notification with the amount displayed 1/100th of its real value (line 612 double-divides Nomba's naira value).

For a pure top-up (send ₦60 to wallet), the user sees "₦0.60 received — doesn't match expected amounts" and a misdirected flag, while only the double-count path works inconsistently.

## Current state

**Key facts about Nomba amounts**: Nomba's `transactionAmount` is in **naira (major units)**. Confirmed by Nomba's own example payload: `"walletBalance": 539.4`, `"transactionAmount": 120`, `"fee": 0.6` — all naira with optional decimals. So `actual = Math.round(transactionAmount * 100)` converts to kobo correctly. **Keep the `* 100`**.

### `src/lib/reconciliation.ts` — `reconcilePayment` (key excerpts at `279fc5d`)

```typescript
// Line 67 (correct — Nomba sends naira)
const actual = Math.round((txn.transactionAmount || 0) * 100);

// Lines 69-83: EARLY FULL CREDIT — WRONG, causes double-credit
await db
  .update(virtualAccounts)
  .set({ balanceKobo: sql`balance_kobo + ${actual}` })
  .where(eq(virtualAccounts.id, va[0].id));
await db.insert(walletTransactions).values({
  userId: va[0].userId, type: "topup", amountKobo: actual,
  reference: `nomba_txn_${txn.transactionId}`,
  status: "success",
  metadata: { nombaRequestId: payload.requestId },
}).onConflictDoNothing();

// ... classification ...

// Lines 130-133: DEAD GATE — always reached after balance already credited
if (classification === "misdirected") {
  await flagForReview(payload, va[0]);
  return { status: "flagged", classification };
}

// Lines 135-155: FIFO + allocation — runs on actual, never debits balance
let remaining = await applyFifoDebtClearing(va[0].userId, actual, va[0].id);
if (remaining > 0) {
  remaining = await allocateToCycle(va[0].userId, remaining, va[0].id, classification, perCircleExpected);
}
// NOTE: overpayment credit block was removed in `279fc5d` — remaining is lost
```

### `flagForReview` (line ~610)

```typescript
// Line 612: WRONG — divides already-naira value by 100
body: `₦${((txn.transactionAmount || 0) / 100).toLocaleString()} received — doesn't match expected amounts.`
// Should be: `(actual / 100).toLocaleString()`
```

### Repo conventions

- All monetary values in the app are **kobo (integer)** — column names end in `Kobo`.
- Error handling: all routes return `success()` / `error()` from `src/lib/api-response.ts`.
- Nomba webhook payload is parsed from raw body; `txn.transactionAmount` is the raw Nomba value (naira).
- Test framework: `tsx --test` (Node built-in test runner). Pattern: `scripts/reconciliation.test.ts`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npx tsc --noEmit` | exit 0, no errors |
| Test | `npx tsx --test scripts/reconciliation.test.ts` | all pass |
| Integration test | `npx tsx --test scripts/reconciliation.integration.test.ts` | all pass |
| Lint | `npx biome check src/` | exit 0 (or fewer errors than before) |

## Scope

**In scope**:
- `src/lib/reconciliation.ts` — `reconcilePayment`, `classifyPayment`, `flagForReview`
- `src/lib/reconciliation.ts` — `extractReference` (add topup ref support)
- `scripts/reconciliation.test.ts` — add test cases
- `src/lib/money.ts` — CREATE (optional helper, see Step 1)

**Out of scope**:
- Any changes to webhook route (`src/app/api/v1/webhooks/nomba/route.ts`) — separate plan
- Any frontend changes
- Any changes to cycle closure (`reconcileCycle` function in the same file)

## Steps

### Step 1: Create `src/lib/money.ts` conversion helpers (optional but recommended)

Create a single module for naira↔kobo conversions so the magic `* 100` / `/ 100` numbers live in exactly one place:

```typescript
export function nombaAmountToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function koboToNaira(kobo: number): number {
  return kobo / 100;
}
```

**Verify**: `npx tsc --noEmit` → exit 0

### Step 2: Remove early full-balance credit in `reconcilePayment`

In `src/lib/reconciliation.ts`, delete the block that credits `balance_kobo` and inserts `walletTransactions` at the top of `reconcilePayment` (around lines 69-83). The balance should only be credited after FIFO + allocation determines `remaining`.

**Verify**: `grep -n "balance_kobo + \${actual}" src/lib/reconciliation.ts` → no matches (the early credit line is gone). The line at Step 5 below is the only one that should remain.

### Step 3: Remove the `misdirected` early-return block

Remove lines 130-133 (`if (classification === "misdirected") { ... return; }`). The `classifyPayment` function can still compute `misdirected` for notification messaging, but it must never block processing.

Move the `flagForReview` call into the notification section below, or call it only when `classification === "misdirected"` AND there's no contribution ref (i.e., log it but never block). Replace the early-return with a non-blocking insert of a notification.

**Verify**: `grep -n "classification === \"misdirected\"" src/lib/reconciliation.ts` → finds only non-blocking usages (no early return).

### Step 4: Add remaining-balance credit after allocation

After `allocateToCycle` returns `remaining`, add a block that credits `remaining` to `balance_kobo` (this handles pure top-ups, overpayment excess, and any amount not consumed by debts+cycles):

```typescript
if (remaining > 0) {
  await db
    .update(virtualAccounts)
    .set({ balanceKobo: sql`balance_kobo + ${remaining}` })
    .where(eq(virtualAccounts.id, va[0].id));

  await db.insert(walletTransactions).values({
    userId: va[0].userId,
    type: "topup",
    amountKobo: remaining,
    reference: `topup_${payload.requestId}`,
    status: "success",
    metadata: { nombaRequestId: payload.requestId, originalAmount: actual, classification },
  }).onConflictDoNothing();
}
```

**Verify**: `sed -n '/if (remaining > 0) {/,/^  }/p' src/lib/reconciliation.ts` after allocation shows the new credit block.

### Step 5: Fix the notification double-divide in `flagForReview`

Change line 612 from:
```typescript
body: `₦${((txn.transactionAmount || 0) / 100).toLocaleString()} received — doesn't match expected amounts.`,
```
To:
```typescript
body: `₦${(actual / 100).toLocaleString()} received — doesn't match expected amounts.`,
```

But `actual` is not in scope inside `flagForReview`. Pass it as a parameter:
- Change signature: `async function flagForReview(payload: WebhookPayload, va: VirtualAccount, actual: number)`
- Update the one call site (after the early-return removal, it may be called from a different location).

**Verify**: `sed -n '/async function flagForReview/,/^}/p' src/lib/reconciliation.ts` shows the updated signature and `/100` usage with `actual`, not `txn.transactionAmount`.

### Step 6: Add `TOPUP_*` reference support to `extractReference`

Update `extractReference` to also recognize top-up references:

```typescript
function extractReference(narration: string): { type: "contribution" | "topup"; ref: string } | null {
  if (!narration) return null;
  const contribMatch = narration.match(/CONTRIB_[a-zA-Z0-9_]+/);
  if (contribMatch) return { type: "contribution", ref: contribMatch[0] };
  const topupMatch = narration.match(/TOPUP_[a-zA-Z0-9_]+/);
  if (topupMatch) return { type: "topup", ref: topupMatch[0] };
  return null;
}
```

If the reference type is `"topup"`, skip FIFO and cycle allocation entirely — credit the full `actual` to balance (the same as a pure top-up with no dues). Update the consumer code accordingly.

**Verify**: `grep -n "extractReference\|topup\|TOPUP" src/lib/reconciliation.ts` shows the updated function and usage.

### Step 7: Add test cases to `scripts/reconciliation.test.ts`

Add test cases (modeled on the existing pattern in the file):

1. **Pure top-up, no dues**: Nomba payload with `transactionAmount: 120`, `narration: ""`, user has no active cycles/debts → `balance_kobo` += 12000, one `topup` wallet_transaction of 12000, zero contribution rows.
2. **Exact contribution**: Nomba payload with `transactionAmount: 50000` (₦50,000), user has ₦50,000 active cycle due → `remaining = 0` after allocation, balance unchanged, one contribution row of 5000000 kobo.
3. **Overpayment 2×**: Nomba payload with `transactionAmount: 100000` (₦100,000), user has ₦50,000 cycle due → contribution row of 5000000, `balance_kobo` += 5000000, one `topup` tx of 5000000.
4. **Underpayment 60%**: Nomba payload with `transactionAmount: 30000` (₦30,000), user has ₦50,000 cycle due → contribution row of 3000000 with status `"partial"`, balance unchanged.
5. **Notification amount**: After a misdirected classification (if any), the `flagForReview` notification uses `actual / 100` format, not `transactionAmount / 100`.

Use `npx tsx --test scripts/reconciliation.test.ts` to run.

## Test plan

- Extend `scripts/reconciliation.test.ts` with the 5 cases in Step 7.
- Existing tests must continue to pass.
- If `scripts/reconciliation.integration.test.ts` exists and tests reconciliation, verify it passes too.

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx tsx --test scripts/reconciliation.test.ts` exits 0 — all new + existing tests pass
- [ ] `npx tsx --test scripts/reconciliation.integration.test.ts` exits 0 (if it exists)
- [ ] `grep -n "balance_kobo + \${actual}" src/lib/reconciliation.ts` returns 0 (early credit removed)
- [ ] The only `balance_kobo +` in reconcilePayment is for `remaining` after allocation
- [ ] `grep "transactionAmount/100" src/lib/reconciliation.ts` returns 0
- [ ] `flagForReview` signature includes `actual: number` parameter
- [ ] No files outside `src/lib/reconciliation.ts`, `src/lib/money.ts`, `scripts/reconciliation.test.ts` are modified

## STOP conditions

- The code excerpts above don't match the current working tree — the codebase has drifted since this plan was written.
- `txn.transactionAmount` is not in naira units (verify: if Nomba's docs contradict the example at `walletBalance: 539.4`, stop — the `* 100` conversion factor may be wrong).
- A verification command fails twice after a reasonable fix attempt.
- The fix requires touching an out-of-scope file.

## Maintenance notes

- The `* 100` / `/ 100` conversion factor is pinned to Nomba sending naira (major units). If Nomba changes this in a future API version, all kobo conversions break silently. The `src/lib/money.ts` module is the single place to update.
- If wallet_transactions are later used for real-time balance computation (not just history), the timing of when we insert them matters — currently they're inserted after funds are credited.
- The `extractReference` change to return `{ type, ref }` is a breaking change for any code that called it expecting a string. The plan only updates the one call site in `reconcilePayment` — grep for other callers before making assumptions.
