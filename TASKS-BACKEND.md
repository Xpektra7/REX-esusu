# Backend Tasks — Esusu

## Supabase & Foundation (El)
- [X] Create Supabase project + set up PostgreSQL database
- [X] Write and run migration: `users` table (id, phone, email, BVN encrypted, name, trust_score, streak, created_at)
- [X] Write and run migration: `circles` table (id, name, type, contribution_amount, frequency, member_limit, default_rule, creator_id, invite_code, status, created_at)
- [X] Write and run migration: `circle_members` table (id, circle_id, user_id, role, joined_at, position)
- [X] Write and run migration: `cycles` table (id, circle_id, cycle_number, status, start_date, end_date, payout_amount, created_at)
- [X] Write and run migration: `contributions` table (id, cycle_id, user_id, amount, status, due_date, paid_at, paid_by, nomba_ref, classification)
- [X] Write and run migration: `payouts` table (id, cycle_id, recipient_id, amount, status, paid_at, nomba_ref)
- [X] Write and run migration: `debts` table (id, cycle_id, debtor_id, creditor_id, amount, status, created_at, resolved_at)
- [X] Write and run migration: `wallet_transactions` table (id, user_id, type, amount, reference, status, metadata, created_at)
- [X] Write and run migration: `notifications` table (id, user_id, type, title, body, data, read_at, created_at)
- [X] Write and run migration: `referrals` table (id, referrer_id, referee_id, status, reward, created_at)
- [X] Add tables: `user_settings`, `contact_messages`, `invite_codes`, `webhook_events`
- [X] Create indexes on foreign keys + status columns + nomba_request_id unique index
- [X] Set up Row Level Security policies on all tables
- [X] Set up Supabase secrets (Nomba API keys, JWT secret, SMTP config)

## Auth API Routes (Richard)
- [X] `POST /api/v1/auth/send-otp` — validate phone, generate OTP, send via SMTP (9999 for whitelisted test numbers)
- [X] `POST /api/v1/auth/verify` — verify OTP, create user if new, return JWT
- [X] `POST /api/v1/auth/set-pin` — set hashed 4-6 digit app PIN
- [X] `POST /api/v1/auth/verify-pin` — verify PIN for sensitive operations
- [X] `POST /api/v1/auth/logout` — invalidate session
- [X] `POST /api/v1/auth/refresh` — refresh JWT
- [X] Retry lock logic: 5 fails → 15min, 10 → 1hr, 15 → admin unlock
- [X] `POST /api/v1/auth/change-password` — validate current pw, hash new pw
- [X] `POST /api/v1/auth/change-pin` — validate current pin, hash new pin

## Nomba Integration (El)
- [X] Create Nomba sandbox account + get API keys
- [X] Write `src/lib/nomba.ts` — HTTP client for Nomba API
- [X] Create Virtual Account for each new user (name + phone metadata)
- [X] Implement webhook verification (HMAC-SHA256, timing-safe comparison)
- [X] Implement bank code lookup endpoint
- [X] Implement transfer to bank account endpoint
- [X] Implement bank account lookup endpoint — validates account name before transfer via Nomba `/v1/transfers/bank/lookup`

## Reconciliation Engine (El)
- [X] Write classification pure function: exact (1.0), underpayment (0.5–0.99), overpayment (1.01–1.5), misdirected (<0.5 or >1.5)
- [X] Write FIFO debt rollover algorithm:
  - [X] Case 1: Joe underpaid → debt tracked, cycle reconcilable
  - [X] Case 2: Joe underpaid → Meni overpaid → Joe's debt pays Meni
  - [X] Case 3: Joe underpaid + multiple creditors → oldest cycle first
  - [X] Case 4: Joe underpaid → next cycle Joe pays double
- [X] Write `reconcileCycle(cycleId)` — orchestrates classification + debt resolution
- [X] Write e2e tests: 85 tests covering reconciliation scenarios (underpayment, debt rollover, full cycle lifecycle)

## Webhook Handler (El)
- [X] `POST /api/v1/webhooks/nomba` — verify HMAC, check idempotency (nomba_request_id unique index)
- [X] Route incoming events: va_credit_notification → match to contribution, run reconciliation
- [X] Return 200 on duplicate events (idempotency)
- [X] Error logging + alert on unrouteable events

## Circle API Routes (El)
- [X] `POST /api/v1/circles` — create circle with invite code
- [X] `GET /api/v1/circles` — list user's circles (active + completed)
- [X] `GET /api/v1/circles/[id]` — circle detail with members + current cycle
- [X] `POST /api/v1/circles/[id]/join` — join by invite code
- [X] `POST /api/v1/circles/[id]/leave` — leave circle (with debt checks)
- [X] `POST /api/v1/circles/[id]/invite` — generate invite link
- [X] `POST /api/v1/circles/[id]/activate` — creator activates, creates Cycle 1
- [X] `GET /api/v1/circles/[id]/report` — full reconciliation audit trail (contributions, debts, payouts, FIFO resolution steps)
- [X] `PATCH /api/v1/circles/[id]/settings` — update circle settings
- [X] `POST /api/v1/circles/[id]/remind` — admin sends reminders to all active members

## Cycle API Routes (El)
- [X] `GET /api/v1/cycles/[id]` — cycle detail (contributions, due dates, status)
- [X] `POST /api/v1/cycles/[id]/close` — auto-close when fully paid OR deadline passed
- [X] `GET /api/v1/circles/[id]/cycles` — list cycles for a circle
- [X] `GET /api/v1/circles/[id]/cycles/current` — get active cycle
- [X] `GET /api/v1/circles/[id]/cycles/[cycleNumber]` — get cycle by number

## Contribution & Payout API Routes (El)
- [X] `POST /api/v1/contributions/initiate` — debit user wallet, allocate to cycle
- [X] `POST /api/v1/contributions/confirm` — mark contribution paid (webhook fallback)
- [X] `GET /api/v1/contributions/history` — user's contribution history
- [X] `GET /api/v1/payouts/history` — user's payout history

## Wallet API Routes (El)
- [X] `GET /api/v1/wallet` — wallet balance + latest transactions
- [X] `GET /api/v1/wallet/transactions` — paginated transactions
- [X] `POST /api/v1/wallet/withdraw` — withdraw to bank account via Nomba transfer
- [X] `POST /api/v1/wallet/topup` — generate topup reference + instructions

## User Profile API Routes (Richard)
- [X] `GET /api/v1/users/me` — current user profile (masked BVN: last 4 digits)
- [X] `PATCH /api/v1/users/me` — update name, email
- [X] BVN encryption/decryption helper (AES-256-GCM)
- [X] `DELETE /api/v1/users/me` — delete account (blocked if active circles/debts)
- [X] `GET/PATCH /api/v1/users/settings` — 14 user preference toggles

## Notifications API Routes (Richard)
- [X] `GET /api/v1/notifications` — list user notifications (paginated)
- [X] `PATCH /api/v1/notifications/[id]/read` — mark one as read
- [X] `POST /api/v1/notifications/read-all` — mark all as read
- [X] `POST /api/v1/notifications/send-remind` — send reminder by member name

## Referral API Routes (Richard)
- [X] `GET /api/v1/referrals` — referral stats + referred users
- [X] Referral code generation + tracking logic

## Debt API Routes (Richard)
- [X] `GET /api/v1/debts` — list user's debts (outgoing + incoming)
- [X] `POST /api/v1/debts/[id]/pay` — pay off a debt

## Other API Routes
- [X] `POST /api/v1/contact` — store contact form submissions
- [X] `GET /api/v1/activity` — aggregated activity feed from wallet, contributions, cycles, debts, payouts
- [X] `GET /api/v1/verify-bvn` — BVN verification
- [X] `GET /api/v1/bank-codes` — list bank codes
- [X] `POST /api/v1/bank-search` — validate account number
- [X] `POST /api/v1/bank-lookup` — proxy to Nomba bank lookup

## Testing
- [X] Write comprehensive e2e API test suite (85 tests across 25 groups covering all endpoints)
- [X] Write focused e2e tests for 8 new contract endpoints (31 tests)
- [X] Test auth flow (OTP → verify → PIN → JWT refresh)
- [X] Test full cycle lifecycle (create → join → activate → contribute → close → payout)
- [X] Test FIFO debt rollover (underpayment → debt → next cycle pays double)
- [X] Test webhook idempotency (duplicate requestId returns 200)
- [X] Test auth guards on all protected endpoints
