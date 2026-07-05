# Esusu Simulation Gaps

Generated from 6-persona × 154-action simulation.
**Legend:** ⚠️ Partial | ❌ Not wired | 🔲 Planned only

---

## ⚠️ Partial (12 items — UI exists but API/mock missing, or vice versa)

### David — New User
- **D8.** Network fails during sendOtp — error banner exists but retry not tested
- **D12.** Password = "Password1" (common) — Zod rejects length/format but not blacklisted patterns
- **D20.** PIN = "0000" — `pinSchema` allows common patterns; should reject sequential/repeated
- **D25.** Tops up → network fails — topup page has no error state
- **D30.** Wallet shows stale balance — no polling/refetch interval on wallet

### Chioma — Active Contributor
- **C38.** Notification: "Contribution due in 24h" — mock data has no `reminder` type
- **C57.** Marks all notifications read — `api.notifications.markAllRead()` has no mock handler
- **C61.** Trust score breakdown — score-meter component exists but breakdown modal not built

### Funke — Wallet Power User
- **F99.** Select bank from dropdown — `api.bankCodes()` exists but has no mock handler
- **F100.** Bank lookup fails — `api.bankLookup()` has no mock handler
- **F104.** Sees balance update after topup — no real-time refetch on wallet

### Ngozi — Power Admin
- **N148.** App offline after PWA install — service worker configured but offline behavior limited

---

## ❌ Not Wired (39 items — UI and/or API don't exist)

### David — New User (5)
- **D1.** Lands on homepage while offline — no offline detection; blank error or crash
- **D8b.** OTP rate-limited (3/hr) — mock never returns rate limit error
- **D14.** Phone dies mid-OTP-entry — sessionStorage lost, no recovery path
- **D16.** BVN already registered — mock returns success always, not `code: "05"`
- **D27.** Top-up notification received — push notification not wired

### Chioma — Active Contributor (8)
- **C43.** Remind endpoint returns error — no error handling on `api.circles.remind()`
- **C45.** Insufficient balance — `initiate` mock always succeeds, doesn't check balance
- **C53.** Underpayment → grace period timer shown — no grace UI in cycle detail
- **C54.** Late payment → trust -2 — no frontend trust recalculation display
- **C58.** Pull-to-refresh notifications — no pull-to-refresh mechanism
- **C59.** 50+ notifications pagination — no cursor/offset pagination on notifications
- **C59b.** `trust_score_changed` notification — no notification type for score changes

### Emeka — Circle Admin (7)
- **E71.** Tap defaulted member → debt breakdown — `debt-breakdown` component not built
- **E77.** Member with active debts tries to leave — mock doesn't validate leave constraints
- **E78.** Admin tries to leave without transferring admin — mock doesn't check admin role
- **E80.** Invite phone not an Esusu user — mock doesn't simulate cross-user notifications
- **E82.** Invite code expired — no expired code UI handling
- **E85.** Download report as CSV — no CSV/PDF export (judging criterion!)
- **E82b.** Mock `/bank-codes` — no handler; `api.bankCodes()` will throw in mock mode

### Funke — Wallet Power User (4)
- **F91.** 100+ transactions pagination — no "load more" on transaction history
- **F92.** Filter transactions by type — no filter controls
- **F104.** Withdrawal → notification — no `withdrawal_status` notification type
- **F105.** Withdrawal fails → payout_failed — mock doesn't simulate failed withdrawal

### Tunde — Lapsed User with Debt (9)
- **T109.** Trust score reflects history — mock returns fixed 50 regardless of history
- **T111.** Default alert notification — no `default_alert` type in mock data
- **T112.** Notification → deep-link to debt — notification deep-links not wired
- **T113.** Circle card shows debt indicator — no debt badge on dashboard circle cards
- **T117.** Tap debt → breakdown — `debt-breakdown` component not built
- **T120.** Accumulated debt summary — no total debt across missed cycles
- **T121.** Payout redirected to creditors — no payout redirection UI
- **T125.** Partial debt clearing — no UI showing partial FIFO clearing
- **T126.** DEFAULTED → ACTIVE status transition — no UI update after debt cleared

### Ngozi — Power Admin (6)
- **N134.** Email change → OTP flow — `PATCH users/me` just updates without verification
- **N139.** Wrong PIN 3 times → 5min soft lock — `pinAttempts` tracked but no lockout UI
- **N140.** Wrong PIN 10 times → force re-login — no auto-clear at threshold
- **N141.** Push notification permission prompt — no dashboard card for push opt-in
- **N142.** Notification deep-link routing — tab navigates to generic page, not specific url
- **N149.** /dashboard accessed while logged out — no middleware guard; flashes dashboard before redirect

---

## 🔲 Planned Only (0 items — no fully unimplemented features from plans)

All planned features have at least partial implementation or are covered by gaps above.

---

## Quick-Fix Priority (12 ⚠️ → ✅)

These are small changes that convert partial items to fully wired:

1. Mock `sendOtp`: return `{ isNewUser: true }` for unregistered phones
2. Add mock handler for `api.wallet.topup()`
3. Add mock handler for `api.notifications.markAllRead()`
4. Add mock handler for `api.bankCodes()`
5. Add mock handler for `api.bankLookup()`
6. Add `reminder` and `default_alert` notification types to mock data
7. Add `trust_score_changed` and `withdrawal_status` notification types
8. Add error state UI on topup page
9. Add retry button to signup OTP error banner
10. Add wallet query refetchInterval (10s)
11. Zod `passwordSchema`: add blacklist check for common patterns
12. Zod `pinSchema`: reject "0000", "1234", sequential/repeated digits

---

## Blockers (39 ❌ — Highest Priority)

Top 10 by judging criteria impact:

1. **CSV/PDF report export** (E85) — directly mentioned in judging criteria
2. **Debt breakdown component** (E71, T117) — core for debt tracking visibility
3. **Payout redirection UI** (T121) — core default resolution feature
4. **Grace period timer UI** (C53) — core underpayment flow feature
5. **Trust score breakdown** (C61) — core trust score feature
6. **Notification deep-linking** (T112, N142) — core UX for notifications
7. **Middleware auth guard** (N149) — security best practice
8. **PIN lockout UI** (N139-140) — security requirement from plans
9. **Accumulated debt summary** (T120) — debt tracking completeness
10. **Dashboard debt indicators** (T113) — surface-level debt visibility
