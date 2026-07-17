# Plan 011: Wrap all money-path writes in database transactions

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat e041804..HEAD -- src/lib/reconciliation.ts src/app/api/v1/wallet/withdraw/ src/app/api/v1/circles/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: none
- **Category**: correctness, security
- **Planned at**: commit `e041804`, 2026-07-17

## Why this matters

Zero database transactions exist anywhere in the codebase. Every multi-write money operation is vulnerable to partial failure — a crash between writes can orphan debts, double-credit accounts, or leave cycles in inconsistent states. In a fintech app handling real money, this is unacceptable.

Current vulnerable paths:
- `reconcileCycle`: debts + cycle close + next cycle + circle update + notifications — ~N+10 writes, zero atomicity
- `reconcilePayment`: debt clearing + cycle allocation + wallet credit — partial failure can double-credit or lose funds
- `activate/route.ts`: cycle insert + circle status update — stuck circle with no active cycle on crash
- `withdraw/route.ts`: balance deduct + Nomba call + tx record — lost funds on crash after deduct

## Current state

- `src/db/index.ts`: Drizzle ORM with Neon serverless Postgres. `db.transaction()` is available via `db.transaction(async (tx) => { ... })` — see [Drizzle docs on transactions](https://orm.drizzle.team/docs/transactions).
- `src/lib/reconciliation.ts`: `reconcileCycle()` (lines ~376-630) and `reconcilePayment()` (lines ~62-196) use raw `db.insert()`, `db.update()`, `db.select()` — no transaction wrapping.
- `src/app/api/v1/wallet/withdraw/route.ts`: Balance deduction is a single `db.update()` but subsequent Nomba API calls and transaction recording are outside any transaction.
- `src/app/api/v1/circles/[id]/activate/route.ts`: Creates cycle row, then updates circle status — should be atomic.

Convention: The codebase uses direct `db.insert()` / `db.update()` calls. Drizzle transactions pass a `tx` object instead of using the global `db` — same API, just scoped.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Lint      | `npx biome check .`      | exit 0              |

## Scope

**In scope**:
- `src/lib/reconciliation.ts` — wrap `reconcilePayment` and `reconcileCycle` bodies in transactions
- `src/app/api/v1/wallet/withdraw/route.ts` — wrap balance deduct + Nomba call + tx record in transaction
- `src/app/api/v1/circles/[id]/activate/route.ts` — wrap cycle insert + circle update in transaction
- `src/app/api/v1/circles/[id]/join/route.ts` — wrap member insert + invite increment + notification

**Out of scope**:
- Do NOT refactor the reconciliation logic — only wrap existing writes in transactions
- Do NOT add retry logic — that's a separate concern
- Do NOT touch any other API routes

## Steps

### Step 1: Wrap `reconcilePayment` in a transaction

In `src/lib/reconciliation.ts`, change the function body of `reconcilePayment` (starts around line 62):

```ts
export async function reconcilePayment(
  nombaTxRef: string,
  virtualAccountId: string,
  amountKobo: number,
  nombaPayload?: WebhookPayload,
) {
  return db.transaction(async (tx) => {
    // existing function body, replacing `db.` with `tx.`
    // ... all the existing logic ...
  });
}
```

Replace every `db.` call inside the body with `tx.`. This includes:
- `db.select()` → `tx.select()`
- `db.insert()` → `tx.insert()`
- `db.update()` → `tx.update()`

The outer function signature stays the same — callers don't change.

**Verify**: `npx tsc --noEmit` exits 0.

### Step 2: Wrap `reconcileCycle` in a transaction

Same pattern as step 1 for the `reconcileCycle` function (starts around line 376):

```ts
export async function reconcileCycle(cycleId: string) {
  return db.transaction(async (tx) => {
    // existing body, `db.` → `tx.`
  });
}
```

**Verify**: `npx tsc --noEmit` exits 0.

### Step 3: Wrap `withdraw/route.ts` POST handler

In `src/app/api/v1/wallet/withdraw/route.ts`, wrap the core logic (balance check + deduction + transaction record creation) in a transaction:

```ts
export async function POST(req: NextRequest) {
  // ... auth, validation, PIN verification ...

  return db.transaction(async (tx) => {
    // Check balance
    const [va] = await tx.select().from(virtualAccounts)
      .where(and(eq(virtualAccounts.userId, userId), eq(virtualAccounts.type, "personal")))
      .forUpdate(); // row lock

    if (!va || va.balanceKobo < totalDeduction) {
      throw new Error("Insufficient balance"); // rolled back
    }

    // Deduct
    await tx.update(virtualAccounts)
      .set({ balanceKobo: sql`${virtualAccounts.balanceKobo} - ${totalDeduction}` })
      .where(eq(virtualAccounts.id, va.id));

    // Record withdrawal
    const [wd] = await tx.insert(walletWithdrawals).values({ ... }).returning();

    // Call Nomba outside the transaction (can't roll back)
    // But the balance is only deducted if Nomba succeeds
    return { withdrawalId: wd.id, merchantRef: wd.nombaTransferRef };
  });
}
```

Key change: use `.forUpdate()` on the SELECT to acquire a row lock. The Nomba API call happens AFTER the transaction commits — if Nomba fails, you detect it via the webhook and credit back.

**Verify**: `npx tsc --noEmit` exits 0.

### Step 4: Wrap `activate/route.ts` in a transaction

In `src/app/api/v1/circles/[id]/activate/route.ts`:

```ts
return db.transaction(async (tx) => {
  const [cycle] = await tx.insert(cycles).values({ ... }).returning();
  await tx.update(circles).set({ status: "active", currentCycle: 1 }).where(eq(circles.id, circleId));
  return cycle;
});
```

**Verify**: `npx tsc --noEmit` exits 0.

### Step 5: Update `reconcileCycle` to use `forUpdate` row locks

Inside the `reconcileCycle` transaction, add `.forUpdate()` when selecting rows that will be modified:

```ts
const [cycle] = await tx.select().from(cycles).where(eq(cycles.id, cycleId)).forUpdate();
const [circle] = await tx.select().from(circles).where(eq(circles.id, cycle.circleId)).forUpdate();
```

This prevents concurrent webhook processing from both trying to close the same cycle.

**Verify**: `npx tsc --noEmit` exits 0.

## Test plan

Manual verification (no test suite exists):
1. Create a circle, activate it — confirm cycle is created and circle status is "active"
2. Trigger reconcilePayment with a valid webhook payload — confirm contribution is recorded
3. Trigger reconcileCycle — confirm cycle is closed and next cycle is created
4. Withdraw from wallet — confirm balance is deducted and withdrawal record is created
5. Simulate a crash mid-transaction (kill the process) — confirm no partial state remains on next startup

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `db.transaction()` is used in `reconcilePayment`, `reconcileCycle`, withdraw route, activate route
- [ ] `.forUpdate()` is used on row SELECTs inside transactions
- [ ] All `db.` calls inside transaction callbacks are replaced with `tx.`
- [ ] No function signatures changed (callers unchanged)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- Drizzle ORM version doesn't support `db.transaction()` — check `package.json` for `drizzle-orm` version (Neon serverless supports it via `@neondatabase/serverless`)
- `.forUpdate()` is not available in the serverless driver — some Neon configurations don't support row locks
- The reconciliation functions use `sql` template literals that behave differently inside transactions

## Maintenance notes

- If new multi-write operations are added, they should follow the same `db.transaction(async (tx) => { ... })` pattern.
- Row locks (`.forUpdate()`) add contention — if performance becomes an issue, consider reducing lock scope or using optimistic locking.
- The withdraw route's Nomba API call happens after the transaction commits. The webhook handler (`handlePayoutSuccess`) already handles Nomba confirmations — ensure the refund-on-failure path is also wrapped.
