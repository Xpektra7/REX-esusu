# Plan 006: Add Daily Frequency Support

**Status:** TODO
**Priority:** P2
**Effort:** S
**Risk:** LOW
**Depends on:** none
**Category:** direction
**Planned at:** commit 1e67046, 2026-07-17

## Why this matters

README promises "daily, weekly, monthly" but code only supports weekly and monthly. Daily-frequency ROSCAs are used by market women, street vendors, and daily-income earners. Adding it unlocks a large user segment.

## Current state

- `src/lib/validations.ts:55` — `frequency: z.enum(["weekly", "monthly"])`
- `src/app/api/v1/circles/route.ts:108` — `cyclePeriodDays = frequency === "weekly" ? 7 : 30`
- `src/app/(dashboard)/circles/new/page.tsx:78-81` — form only shows Weekly/Monthly

## Steps

1. Add `"daily"` to Zod enum in `validations.ts`.
2. Add `else if (frequency === "daily") cyclePeriodDays = 1` to circles create route.
3. Set default grace period for daily: `gracePeriodHours || 6` for daily.
4. Add "Daily" option to create-circle form UI.

## Done criteria

- [ ] Daily frequency accepted by API and creates correct cycle period
- [ ] Users can create daily circles
- [ ] `npx tsc --noEmit` passes
