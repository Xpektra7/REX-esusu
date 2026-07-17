# Plan 009: React Hygiene — Dynamic Imports, Memo, Booleans, Ternary, Resource Hints

**Status:** TODO
**Priority:** P2
**Effort:** S
**Risk:** LOW
**Depends on:** none
**Category:** perf
**Planned at:** commit 3c6b254, 2026-07-17

## Why this matters

7 small violations of Vercel React best practices and composition patterns. None blocks functionality, but they accumulate into layout shifts, unnecessary re-renders, and harder-to-maintain components.

## Steps

1. **Dynamic import Hero**: Wrap `Hero` (or `CircleDiagram`) in `next/dynamic()` in landing page.
2. **Defer Toaster**: Wrap `Toaster` from `sonner` with `next/dynamic({ ssr: false })` in root layout.
3. **Memo leaf components**: Wrap `WalletCard`, `HeroPotCard`, `MemberList` exports with `React.memo()`.
4. **Derive instead of effect**: In `circles/[id]/settings/page.tsx`, replace `useEffect` sync of `name` with inline derivation.
5. **Preconnect API**: Replace `<link rel="preconnect">` with `preconnect()` from `react-dom`.
6. **Boolean props → composition**: Refactor `showCloseButton`, `showClear`, `showTrigger`, `showRemove` on Dialog, Sheet, Combobox into explicit subcomponents.

## Done criteria

- [ ] Landing page Hero dynamically imported
- [ ] Toaster deferred to client-side
- [ ] Leaf components wrapped in `React.memo()`
- [ ] No `useEffect` for derived state in settings page
- [ ] `preconnect()` used instead of manual `<link>`
- [ ] Boolean props replaced with composition
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
