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
- [X] Create indexes on foreign keys + status columns + nomba_request_id unique index
- [X] Set up Row Level Security policies on all tables
- [X] Set up Supabase secrets (Nomba API keys, JWT secret, SMTP config)

## Auth API Routes (Richard)
- [+] `POST /api/v1/auth/send-otp` — validate phone, generate OTP, send via SMTP (9999 for whitelisted test numbers)
- [+] `POST /api/v1/auth/verify` — verify OTP, create user if new, return JWT
- [+] `POST /api/v1/auth/set-pin` — set hashed 4-6 digit app PIN
- [+] `POST /api/v1/auth/verify-pin` — verify PIN for sensitive operations
- [+] `POST /api/v1/auth/logout` — invalidate session
- [+] `POST /api/v1/auth/refresh` — refresh JWT
- [+] Retry lock logic: 5 fails → 15min, 10 → 1hr, 15 → admin unlock

## Nomba Integration (El)
- [X] Create Nomba sandbox account + get API keys
- [X] Write `src/lib/nomba.ts` — HTTP client for Nomba API
- [+] Create Virtual Account for each new user (name + phone metadata)
- [+] Implement webhook verification (HMAC-SHA256, timing-safe comparison)
- [+] Implement bank code lookup endpoint
- [+] Implement transfer to bank account endpoint
- [+] Implement bank account lookup endpoint — validates account name before transfer via Nomba `/v1/transfers/bank/lookup`

## Reconciliation Engine (El) — HIGHEST PRIORITY
- [X] Write classification pure function: exact (1.0), underpayment (0.5–0.99), overpayment (1.01–1.5), misdirected (<0.5 or >1.5)
- [X] Write FIFO debt rollover algorithm:
  - [X] Case 1: Joe underpaid → debt tracked, cycle reconcilable
  - [X] Case 2: Joe underpaid → Meni overpaid → Joe's debt pays Meni
  - [X] Case 3: Joe underpaid + multiple creditors → oldest cycle first
  - [X] Case 4: Joe underpaid → next cycle Joe pays double
- [X] Write `reconcileCycle(cycleId)` — orchestrates classification + debt resolution
- [+] Write unit tests: 10+ scenarios covering all classification categories + FIFO cases
- [+] Write integration test: full cycle lifecycle (create → contribute → reconcile → payout)

## Webhook Handler (El)
- [ ] `POST /api/v1/webhooks/nomba` — verify HMAC, check idempotency (nomba_request_id unique index)
- [ ] Route incoming events: va_credit_notification → match to contribution, run reconciliation
- [ ] Return 200 on duplicate events (idempotency)
- [ ] Error logging + alert on unrouteable events

## Circle API Routes (El)
- [ ] `POST /api/v1/circles` — create circle with invite code
- [ ] `GET /api/v1/circles` — list user's circles (active + completed)
- [ ] `GET /api/v1/circles/[id]` — circle detail with members + current cycle
- [ ] `POST /api/v1/circles/[id]/join` — join by invite code
- [ ] `POST /api/v1/circles/[id]/leave` — leave circle (with debt checks)
- [ ] `POST /api/v1/circles/[id]/invite` — generate invite link
- [ ] `POST /api/v1/circles/[id]/activate` — creator activates, creates Cycle 1
- [ ] `GET /api/v1/circles/[id]/report` — full reconciliation audit trail (contributions, debts, payouts, FIFO resolution steps)

## Cycle API Routes (El)
- [ ] `GET /api/v1/cycles/[id]` — cycle detail (contributions, due dates, status)
- [ ] `POST /api/v1/cycles/[id]/close` — auto-close when fully paid OR deadline passed

## Contribution & Payout API Routes (El)
- [ ] `POST /api/v1/contributions/initiate` — debit user wallet, allocate to cycle
- [ ] `POST /api/v1/contributions/confirm` — mark contribution paid (webhook fallback)
- [ ] `GET /api/v1/contributions/history` — user's contribution history
- [ ] `GET /api/v1/payouts/history` — user's payout history

## Wallet API Routes (El)
- [ ] `GET /api/v1/wallet` — wallet balance + latest transactions
- [ ] `GET /api/v1/wallet/transactions` — paginated transactions
- [ ] `POST /api/v1/wallet/withdraw` — withdraw to bank account via Nomba transfer

## User Profile API Routes (Richard)
- [ ] `GET /api/v1/users/me` — current user profile (masked BVN: last 4 digits)
- [ ] `PATCH /api/v1/users/me` — update name, email
- [ ] BVN encryption/decryption helper (AES-256-GCM)

## Notifications API Routes (Richard)
- [ ] `GET /api/v1/notifications` — list user notifications (paginated)
- [ ] `PATCH /api/v1/notifications/[id]/read` — mark one as read
- [ ] `POST /api/v1/notifications/read-all` — mark all as read

## Referral API Routes (Richard)
- [ ] `GET /api/v1/referrals` — referral stats + referred users
- [ ] Referral code generation + tracking logic

## Debt API Routes (Richard)
- [ ] `GET /api/v1/debts` — list user's debts (outgoing + incoming)
- [ ] `POST /api/v1/debts/[id]/pay` — pay off a debt

## Testing (Richard + El)
- [ ] Write unit tests for reconciliation engine (Richard + El review)
- [ ] Write integration tests for auth flow (phone → OTP → PIN → session)
- [ ] Write integration tests for full cycle lifecycle
- [ ] Write webhook idempotency test
- [ ] Test FIFO debt rollover edge cases (partial payments, concurrent cycles)
