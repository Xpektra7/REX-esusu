# Plan 015: Wallet/Nomba VA gap fixes — provisioning, bank management, payout accounting, balance resync

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: correctness
- **Planned at**: commit `1ef1f14`, 2026-07-17

## Changes Made

| Gap | Fix | Files |
|-----|-----|-------|
| VA sandbox fallback | Removed — production users can no longer get sandbox VAs | `src/app/api/v1/auth/verify/route.ts` |
| Wrong bank code stored | Changed from `vaBody.bankName \|\| vaBody.bank \|\| vaBody.bankCode` to just `vaBody.bankCode` | `src/app/api/v1/auth/verify/route.ts` |
| VA provisioning non-fatal | User creation is rolled back (`db.delete(users)`) if VA creation fails | `src/app/api/v1/auth/verify/route.ts` |
| No bank account management | Added `PATCH /api/v1/wallet/bank` — updates bankCode with Nomba verification | `src/app/api/v1/wallet/bank/route.ts` |
| No walletTransaction for payouts | Added `walletTransactions.insert` in `handlePayoutSuccess` | `src/lib/payout.ts` |
| No VA balance resync | Added `POST /api/v1/wallet/resync` — calls Nomba `getVirtualAccount`, syncs `balanceKobo` | `src/app/api/v1/wallet/resync/route.ts` |

## Remaining

- Webhook retry / daily reconciliation cron job (deferred — lower urgency)
- Bank account management UI (frontend — the endpoint exists, needs a settings form field)
