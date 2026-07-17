# Plan 014: Batch N+1 queries in reconciliation engine

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat e041804..HEAD -- src/lib/reconciliation.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: 011 (for transaction-safe refactoring)
- **Category**: perf
- **Planned at**: commit `e041804`, 2026-07-17

## Why this matters

The reconciliation engine issues 4+ DB queries per member circle plus 1 query per member for contributions. For a 20-member circle, a single `reconcileCycle` call makes ~100 DB round-trips. Nomba webhooks timeout if reconciliation takes too long. At scale (100+ circles), this pattern will cause cascading timeouts and webhook retry storms.

## Current state

- `src/lib/reconciliation.ts:217-259`: `getExpectedPerActiveCircle()` iterates over member circle IDs and issues 4 queries per ID (circle lookup, cycle lookup, member lookup, pending debts). Called once per member.
- `src/lib/reconciliation.ts:376-630`: `reconcileCycle()` iterates over members and for each one queries contributions, user name, debts — all separate queries.
- `getMemberCircleIds()` is called 3 times (lines 91, 98, 117 from `reconcilePayment`) returning the same data.
- `src/db/schema.ts`: Tables have proper indexes on foreign keys and status columns.

Convention: The codebase uses `db.select().from(table).where(...)` with Drizzle ORM. Batch loading uses `inArray()`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Lint      | `npx biome check .`      | exit 0              |

## Scope

**In scope**:
- `src/lib/reconciliation.ts` — only this file
- Batch queries in `getExpectedPerActiveCircle`, `reconcileCycle`, and `reconcilePayment`

**Out of scope**:
- Do NOT change any function signatures
- Do NOT change any other files
- Do NOT add caching (Redis/memoization) — that's a separate optimization
- Do NOT touch the Nomba API client or webhook handler

## Steps

### Step 1: Fix `getMemberCircleIds` being called 3 times

In `reconcilePayment`, find the 3 calls to `getMemberCircleIds(va[0].userId)` (lines ~91, 98, 117):

```diff
+ const memberCircleIds = await getMemberCircleIds(va[0].userId);
```

Replace all 3 calls with the cached variable.

**Verify**: `grep -n "getMemberCircleIds" src/lib/reconciliation.ts` shows exactly 1 call site (the cached variable assignment).

### Step 2: Batch queries in `getExpectedPerActiveCircle`

In `getExpectedPerActiveCircle`, replace the per-ID queries with batch queries using `inArray`:

Current pattern (pseudocode):
```
for each memberCircleId:
  circle = db.select().from(circles).where(eq(circles.id, memberCircle.circleId))
  cycle = db.select().from(cycles).where(...)
  member = db.select().from(membersCircles).where(eq(membersCircles.id, memberCircleId))
```

Replace with batch queries:
```
// Gather all circle IDs and cycle IDs
const circleIds = memberCircles.map(mc => mc.circleId);
const cycleIds = memberCircles.map(mc => mc.cycleId);

// Batch queries
const circlesMap = new Map(
  (await db.select().from(circles).where(inArray(circles.id, circleIds)))
    .map(c => [c.id, c])
);
const cyclesMap = new Map(
  (await db.select().from(cycles).where(inArray(cycles.id, cycleIds)))
    .map(c => [c.id, c])
);

// Then use maps instead of per-ID queries
```

**Verify**: `npx tsc --noEmit` exits 0.

### Step 3: Batch member queries in `reconcileCycle`

In `reconcileCycle`, find the loop that processes each member (around line 439-511). Currently it queries contributions per member:

```diff
- for (const member of members) {
-   const [lastContribution] = await db.select()...
-   // ...
- }
```

Replace with:
```
// Batch all contributions for this cycle
const allContributions = await db.select()
  .from(contributions)
  .where(eq(contributions.cycleId, cycleId));

const contributionsByMember = new Map<string, typeof contributions.$inferSelect[]>();
for (const c of allContributions) {
  const arr = contributionsByMember.get(c.memberCircleId) || [];
  arr.push(c);
  contributionsByMember.set(c.memberCircleId, arr);
}

// Now iterate — no queries inside the loop
for (const member of members) {
  const memberContribs = contributionsByMember.get(member.id) || [];
  // ... existing logic using memberContribs ...
}
```

**Verify**: `npx tsc --noEmit` exits 0.

### Step 4: Verify no remaining per-row queries

Search for patterns that indicate per-row queries in the reconciliation functions:

```bash
grep -n "await db.select\|await db.insert\|await db.update" src/lib/reconciliation.ts | head -30
```

Any `db.` call inside a `for` or `forEach` loop that iterates over members is suspect. Move batchable queries outside the loop as in Step 3.

**Verify**: No `await db.*` calls remain inside loops over members or member circles.

## Test plan

No existing test suite. Verify by:
1. Run `npx tsc --noEmit` — must pass
2. Create a circle with 5+ members, trigger reconcileCycle — confirm cycle closes without timeout
3. Monitor query count (Postgres logs or Drizzle debug logging) — confirm it's O(number of tables) not O(number of members)

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `getMemberCircleIds` is called exactly once (cached) in `reconcilePayment`
- [ ] No `await db.*` calls inside `for`/`forEach` loops over members in reconciliation functions
- [ ] `getExpectedPerActiveCircle` uses `inArray` batching instead of per-ID queries
- [ ] `reconcileCycle` batches contributions by cycleId before the member loop
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:
- `inArray` with a very large array doesn't work with Neon serverless Postgres (check for parameter limit issues — Neon uses Postgres 16 which supports up to 65535 parameters)
- The reconciliation functions have side effects inside loops that depend on sequential execution order (e.g., a debt clearing order that the batch changes)
- TypeScript errors about `inArray` argument types — ensure the array type matches the column type

## Maintenance notes

- If circle sizes grow beyond 50 members, consider paginating batch queries or using cursor-based iteration.
- The batch pattern (`inArray` + `Map` for lookups) should be reused whenever a new query is added that loops over members.
- If Drizzle adds query logging, add a `DEBUG=1` env that logs query counts to catch regressions.
