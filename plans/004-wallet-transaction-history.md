# Plan 004: Fix wallet transaction history — type mapping + withdrawal recording

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 279fc5d..HEAD -- src/app/api/v1/wallet/transactions/route.ts src/app/api/v1/wallet/withdraw/route.ts src/app/(dashboard)/wallet/page.tsx src/lib/api.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `279fc5d`, 2026-07-09

## Why this matters

Two bugs that together make the wallet transaction history unusable in production:

1. **Type mismatch**: The backend API (`src/app/api/v1/wallet/transactions/route.ts`) passes through the database `type` column verbatim — values like `"topup"`, `"withdrawal"`, `"debt_payment"`. The frontend (`src/app/(dashboard)/wallet/page.tsx:152`) checks `tx.type === "credit"` to determine color and `+`/`-` prefix. Since `"topup" !== "credit"`, ALL transactions render as debits (red `-` prefix) regardless of direction. The avatar seed and description text at line 159/161 use `tx.description` which doesn't exist in the API response — causing `DiceBearAvatar` to render blank.

2. **Withdrawals invisible**: `src/app/api/v1/wallet/withdraw/route.ts` never inserts a `wallet_transactions` row. After a successful withdrawal, the user sees no history entry and the activity feed gets no event. The money is gone with no record the user can see.

## Current state

### `src/app/api/v1/wallet/transactions/route.ts`

Returns raw DB columns — `type` is semantic ("topup"/"withdrawal"/"debt_payment"), `description` is not included because the DB schema has no `description` column:

```typescript
// Line 34-42: passes through t.type as-is
return success({
  transactions: rows.map((t) => ({
    id: t.id,
    type: t.type,            // "topup", not "credit"
    amountKobo: t.amountKobo,
    reference: t.reference,
    status: t.status,
    metadata: t.metadata,
    createdAt: t.createdAt,
    // no description field
  })),
});
```

### DB schema (`src/db/schema.ts:314-335`)

```typescript
export const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 30 }).notNull(),  // "topup" | "withdrawal" | "debt_payment"
  amountKobo: integer("amount_kobo").notNull(),
  reference: varchar("reference", { length: 255 }).unique(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Frontend `src/app/(dashboard)/wallet/page.tsx` (the consumer)

```typescript
// Line 26-35: interface expects "credit" | "debit" and description
interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  amountKobo: number;
  reference: string;
  status: string;
  description: string;
  metadata: unknown;
  createdAt: string;
}

// Line 152: critical type check
const isCredit = tx.type === "credit";

// Line 159-161: uses description for display + avatar seed
<DiceBearAvatar name={tx.description} />
<p className="text-sm font-medium">{tx.description}</p>
```

### `src/app/api/v1/wallet/withdraw/route.ts`

Full withdrawal flow: atomic balance deduct → Nomba transfer → success response. But **never** inserts a `wallet_transactions` row. The user sees no record of the withdrawal.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npx tsc --noEmit` | exit 0, no errors |
| Test | `npx tsx --test scripts/wallet.test.ts` | all pass |
| Lint | `npx biome check src/` | exit 0 |

## Scope

**In scope**:
- `src/app/api/v1/wallet/transactions/route.ts` — add type mapping + description derivation
- `src/app/api/v1/wallet/withdraw/route.ts` — insert wallet_transactions row on success
- `src/lib/types.ts` — CREATE shared `WalletTransactionResponse` type (optional)
- `src/app/(dashboard)/wallet/page.tsx` — update interface to match new API shape (or use the mapped shape)

**Out of scope**:
- Any changes to the DB schema (no migration needed)
- Updating the activity feed (separate concern)
- Withdraw reversal/credit-back flow (already exists on error)
- Frontend style changes beyond type matching

## Steps

### Step 1: Add type mapping in `transactions/route.ts`

In the `rows.map()` callback, map semantic DB types to credit/debit:

```typescript
// Define credit semantic types
const CREDIT_TYPES = new Set(["topup", "debt_payment", "cycle_payment", "refund"]);
const DEBIT_TYPES = new Set(["withdrawal", "transfer", "payout"]);

return success({
  transactions: rows.map((t) => ({
    id: t.id,
    type: CREDIT_TYPES.has(t.type) ? "credit" as const : "debit" as const,
    amountKobo: t.amountKobo,
    reference: t.reference,
    status: t.status,
    description: deriveDescription(t.type, t.reference, t.metadata),
    metadata: t.metadata,
    createdAt: t.createdAt,
  })),
});
```

Add a `deriveDescription` helper:

```typescript
function deriveDescription(type: string, reference: string | null, metadata: unknown): string {
  switch (type) {
    case "topup":
      return "Wallet Top-Up";
    case "withdrawal":
      return "Withdrawal";
    case "debt_payment":
      return "Cycle Contribution";
    case "cycle_payment":
      return "Cycle Payout";
    case "refund":
      return "Refund";
    default:
      return "Transaction";
  }
}
```

**Verify**: `grep "CREDIT_TYPES\|DEBIT_TYPES\|deriveDescription" src/app/api/v1/wallet/transactions/route.ts` → all present. `npx tsc --noEmit` → exit 0.

### Step 2: Insert wallet_transactions row on withdrawal success

In `src/app/api/v1/wallet/withdraw/route.ts`, after the successful Nomba transfer response (after line 102, before the `return success` at line 104), add a database insert:

```typescript
// Insert a wallet_transactions record for history
await db
  .insert(walletTransactions)
  .values({
    userId: auth.user.userId,
    type: "withdrawal",
    amountKobo,
    reference: transferRef,
    status: "success",
    metadata: {
      bankCode,
      accountNumber: accountNumber.slice(-4),  // only last 4 digits
      nombaTransferRef: transferRef,
    },
  })
  .onConflictDoNothing();
```

Also add the `walletTransactions` import at the top:
```typescript
import { walletTransactions } from "@/db/schema";
```

**Verify**: `grep "walletTransactions" src/app/api/v1/wallet/withdraw/route.ts` → import and insert exist. `grep "type: .withdrawal."` → found. `npx tsc --noEmit` → exit 0.

### Step 3: Verify frontend compatibility

The frontend `WalletTransaction` interface now matches the API response (both have `type: "credit" | "debit"` and `description: string`). The `DiceBearAvatar` will render with the description string as seed. No frontend changes should be needed — verify by reading the file.

**Verify**: `grep "type:.*credit.*debit" src/app/(dashboard)/wallet/page.tsx` → found at line 28, matches the new API output.

## Test plan

- Manual test: Navigate to `/wallet` page in the browser. All transactions should show the correct `+`/`-` prefix and green/red coloring based on direction.
- Manual test: Perform a withdrawal. After success, the transaction history should show a "Withdrawal" entry.
- Unit test: If `scripts/wallet.test.ts` exists, run: `npx tsx --test scripts/wallet.test.ts`.
- Create `scripts/wallet.test.ts` with:
  1. Map known semantic types ("topup", "debt_payment") → "credit"
  2. Map known semantic types ("withdrawal", "payout") → "debit"
  3. Unknown type maps to "debit" (default)

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/` exits 0 (or same errors as before)
- [ ] `grep "CREDIT_TYPES\|DEBIT_TYPES" src/app/api/v1/wallet/transactions/route.ts` — found
- [ ] `grep "deriveDescription" src/app/api/v1/wallet/transactions/route.ts` — found
- [ ] `grep "type: .withdrawal." src/app/api/v1/wallet/withdraw/route.ts` — found
- [ ] `grep "walletTransactions" src/app/api/v1/wallet/withdraw/route.ts` — import + insert found
- [ ] Frontend renders `+` for top-ups and `-` for withdrawals (red/green color)
- [ ] No files outside `src/app/api/v1/wallet/transactions/route.ts`, `src/app/api/v1/wallet/withdraw/route.ts` are modified

## STOP conditions

- The `deriveDescription` function name collides with existing exports — rename to `_deriveDescription` or `getTxDescription` if needed.
- `walletTransactions` is already imported in the withdraw file — skip the import step.
- A verification command fails twice after a reasonable fix attempt.

## Maintenance notes

- The type set used for mapping (`CREDIT_TYPES` / `DEBIT_TYPES`) will need updating if new transaction types are added to the schema. Consider extracting this to a config or enum file if the list grows.
- The `description` is static per type. Future enhancement: use metadata for dynamic descriptions (e.g., "Debt Payment #4" instead of generic "Cycle Contribution").
- Withdrawal `metadata.bankCode` + `accountNumber` (last 4) provides enough info for support to trace, without exposing full account numbers in the API response.
