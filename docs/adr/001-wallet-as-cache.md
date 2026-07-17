# ADR 001: Wallet Balance as Local Cache Over Nomba VA

**Date:** 2026-07-17

## Context

The app tracks a local `wallet_balance` column and `wallet_transactions` table alongside the real Nomba virtual account balance. Previously unclear whether the wallet layer adds value or is redundant.

## Decision

- Wallet balance + transactions are kept as a **local cache** for fast reads (no Nomba API call to show balance)
- Nomba VA is the **source of truth** for actual funds
- Periodic resync will reconcile local cache against Nomba VA to fix drift
- Contributions continue to debit from local wallet balance (not directly from VA via Nomba push-payment)

## Consequences

- Users see balance instantly (local DB read, no API call)
- Cache drift possible on missed webhooks → periodic resync required
- Simpler contribution flow (no Nomba transfer API calls per contribution)
- One extra consistency concern to monitor
