# Plan 012: Wire up payout transfer after cycle close

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat e041804..HEAD -- src/lib/reconciliation.ts src/lib/payout.ts src/app/api/v1/webhooks/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: 011 (transaction safety)
- **Category**: correctness, bug
- **Planned at**: commit `e041804`, 2026-07-17

## Why this matters

Payouts are completely broken end-to-end. `reconcileCycle` closes the cycle and creates the next one but **never initiates the actual payout transfer** to the recipient. No `payoutTransactions` row is created, no Nomba transfer API is called. The `handlePayoutSuccess` webhook handler expects a `payoutTransactions` row to exist — but nothing creates it. Recipients never get paid.

## Current state

- `src/lib/reconciliation.ts:376-630`: `reconcileCycle` processes debts, closes the cycle, creates the next cycle, but has no code to initiate a payout. Search for "payout" in the file — the word doesn't appear outside comments.
- `src/lib/payout.ts`: Exists with `handlePayoutSuccess(userId, data)` and `handlePayoutFailed(userId, data)` — these handle **webhook callbacks** but nothing calls Nomba to initiate the transfer.
- `src/app/api/v1/webhooks/nomba/route.ts`: Handles `payment_success` and `payout_success`/`payout_failed` — but `payout_success` never fires because nothing creates the payout.
- `src/lib/nomba.ts`: Has `initiateTransfer()` that calls Nomba's Transfer API — works correctly.
- Schema: `payoutTransactions` table exists with columns `cycleId, recipientUserId, amountKobo, nombaTransferRef, status`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Lint      | `npx biome check .`      | exit 0              |

## Scope

**In scope**:
- `src/lib/reconciliation.ts` — add payout initiation at the end of `reconcileCycle`
- `src/lib/payout.ts` — add `initiatePayout()` function that calls Nomba and creates `payoutTransactions`
- `src/app/api/v1/webhooks/nomba/route.ts` — wire `payout_success` and `payout_failed` to update `payoutTransactions`

**Out of scope**:
- Do NOT change the debt-clearing logic
- Do NOT change the next-cycle creation logic
- Do NOT change the Nomba API client

## Steps

### Step 1: Create `initiatePayout` function

In `src/lib/payout.ts`, add:

```ts
import { db } from "@/db";
import { payoutTransactions, virtualAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nomba } from "./nomba";

export async function initiatePayout(cycleId: string, recipientUserId: string, amountKobo: number): Promise<string> {
  const merchantTxRef = `payout_${cycleId}_${Date.now()}`;

  // Create pending payout transaction
  const [pt] = await db.insert(payoutTransactions).values({
    cycleId,
    recipientUserId,
    amountKobo,
    nombaTransferRef: merchantTxRef,
    status: "pending",
  }).returning();

  // Get recipient's bank details from their personal VA
  const [va] = await db.select()
    .from(virtualAccounts)
    .where(eq(virtualAccounts.userId, recipientUserId))
    .limit(1);

  if (!va?.bankCode || !va?.accountNumber) {
    // No bank details — mark as failed, manual intervention needed
    await db.update(payoutTransactions)
      .set({ status: "failed" })
      .where(eq(payoutTransactions.id, pt.id));
    throw new Error(`No bank details for user ${recipientUserId}`);
  }

  try {
    const nombaResult = await nomba.initiateTransfer({
      amount: amountKobo / 100, // Nomba expects naira, not kobo
      accountNumber: va.accountNumber,
      accountName: va.accountName,
      bankCode: va.bankCode,
      merchantTxRef,
      senderName: "Esusu",
    });

    await db.update(payoutTransactions)
      .set({
        status: "processing",
        nombaResponse: nombaResult as any,
      })
      .where(eq(payoutTransactions.id, pt.id));

    return pt.id;
  } catch (err: any) {
    await db.update(payoutTransactions)
      .set({ status: "failed", nombaResponse: err as any })
      .where(eq(payoutTransactions.id, pt.id));
    throw err;
  }
}
```

**Verify**: `npx tsc --noEmit` exits 0.

### Step 2: Call `initiatePayout` from `reconcileCycle`

In `src/lib/reconciliation.ts`, at the end of `reconcileCycle`, after the cycle is closed and before/after the next cycle is created:

```ts
import { initiatePayout } from "./payout";

// Inside reconcileCycle, after cycle close and next cycle creation:

// Initiate payout to the cycle recipient
const recipientMember = members.find(m => m.id === cycle.recipientMemberId);
if (recipientMember && cycle.actualTotalKobo > 0) {
  // Calculate payout amount: actual total minus 1% fee (capped at 5000 kobo)
  const fee = Math.min(5000, Math.ceil(cycle.actualTotalKobo * 0.01));
  const payoutAmount = cycle.actualTotalKobo - fee;

  if (payoutAmount > 0) {
    await initiatePayout(cycleId, recipientMember.userId, payoutAmount);
  }
}
```

Place this AFTER the transaction from Plan 011 commits — or include it inside the transaction if you want atomicity (though the Nomba API call can't be rolled back).

**Verify**: `npx tsc --noEmit` exits 0.

### Step 3: Wire up payout webhook handlers

In `src/app/api/v1/webhooks/nomba/route.ts`:

For `payout_success`:
```ts
// Find payout by merchantTxRef
const [pt] = await db.select().from(payoutTransactions)
  .where(eq(payoutTransactions.nombaTransferRef, merchantTxRef))
  .limit(1);

if (pt) {
  await db.update(payoutTransactions)
    .set({ status: "success", completedAt: new Date() })
    .where(eq(payoutTransactions.id, pt.id));
}
```

For `payout_failed`:
```ts
// Find payout by merchantTxRef
const [pt] = await db.select().from(payoutTransactions)
  .where(eq(payoutTransactions.nombaTransferRef, merchantTxRef))
  .limit(1);

if (pt) {
  await db.update(payoutTransactions)
    .set({ status: "failed", completedAt: new Date() })
    .where(eq(payoutTransactions.id, pt.id));
}
```

**Verify**: `npx tsc --noEmit` exits 0.

## Test plan

Manual verification:
1. Create a circle, add members, trigger reconcileCycle — confirm `payoutTransactions` row is created with status "pending"
2. Confirm Nomba transfer is initiated (check Nomba dashboard or logs)
3. Simulate `payout_success` webhook — confirm `payoutTransactions` status updates to "success"
4. Simulate `payout_failed` webhook — confirm `payoutTransactions` status updates to "failed"

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `reconcileCycle` creates a `payoutTransactions` row with status "pending"
- [ ] `reconcileCycle` calls `nomba.initiateTransfer()` with the correct amount (actualTotal - fee)
- [ ] `handlePayoutSuccess` updates `payoutTransactions` status to "success"
- [ ] `handlePayoutFailed` updates `payoutTransactions` status to "failed"
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- `src/lib/payout.ts` doesn't exist or has a different structure than described
- `reconcileCycle` doesn't have access to `members` with `userId` — check the data shape
- Nomba `initiateTransfer` expects different parameters than documented — check `src/lib/nomba.ts`
- The cycle's `actualTotalKobo` could be 0 (all members missed) — handle that case

## Maintenance notes

- Payout failures currently require manual intervention to retry. Consider adding a retry mechanism for failed payouts.
- The 1% fee (capped at ₦50) should be configurable via env var or circle settings.
- If the recipient has no bank details on file, the payout is marked as failed — add a notification to prompt the user to add bank details.
