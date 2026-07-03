# Esusu — Digital Group Savings

Esusu is a digital **Ajo/Esusu platform** that lets groups of people save money together, transparently. Powered by **Nomba** for virtual accounts and payment reconciliation, it brings the traditional Nigerian rotating savings model to your phone — no spreadsheets, no distrust, no missed collections.

## How It Works

1. **Create or join a circle** — Set a contribution amount and frequency (daily, weekly, monthly). Each circle gets a private invite code.
2. **Each member gets a personal Nomba virtual account** — No shared accounts. Everyone pays into their own dedicated account number.
3. **Contributions are tracked automatically** — Our engine reconciles payments, tracks who's up to date, and sends payouts to the next recipient on schedule.
4. **Payouts rotate** — Each cycle, one member receives the full pool. The cycle repeats until everyone has been paid.

## Features

- **Circle management** — Create, join, invite, leave circles. Set contribution amounts and schedules.
- **Individual virtual accounts** — Every member gets their own Nomba bank account number. Contribute via bank transfer.
- **Auto-reconciliation** — Payments are matched to contributions automatically. See who has paid and who hasn't in real time.
- **Rotating payouts** — Each cycle member gets their turn. The system tracks the rotation and sends payouts.
- **Wallet & Top-up** — Deposit money into your wallet via bank transfer to your personal virtual account.
- **Referral system** — Invite friends and earn trust score boosts.
- **Notifications** — Get reminded when contributions are due and when payouts arrive.
- **Responsive design** — Works on mobile and desktop. Installable as a PWA for offline access and push notifications.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs in **mock mode** by default — no real API keys needed.

### Testing the app

Use any of these numbers as your phone number (enter `8000000123` in the phone field — the `+234` prefix is pre-filled):

| Phone | OTP |
|---|---|
| `+234 800 0000 123` | `999999` |
| `+234 800 0000 124` | `999999` |
| `+234 800 0000 125` | `999999` |

Any password works as long as it's at least 8 characters (e.g. `password123`).

You can also add or change whitelisted numbers in the `OTP_WHITELIST` variable inside `.env`.

### Environment Variables

| Variable | What it's for |
|---|---|
| `JWT_SECRET` | Signs authentication tokens |
| `BVN_ENCRYPTION_KEY` | Encrypts BVN data at rest |
| `DATABASE_URL` | PostgreSQL connection (Neon, Supabase, etc.) |
| `NOMBA_*` | Nomba API credentials for virtual accounts and payments |
| `NOMBA_WEBHOOK_SECRET` | Verifies Nomba webhook signatures |
| `OTP_WHITELIST` | Phone numbers that always get a fixed OTP in development |

## Built With

- **Next.js 16** — App Router, Turbopack, PWA
- **Tailwind CSS v4** — Utility-first styling
- **shadcn/ui (base-vega)** — Component system built on Base UI
- **TanStack React Query** — Server state management
- **Drizzle ORM** — Database access with PostgreSQL
- **Zustand** — Client-side auth state
- **Serwist** — PWA service worker (production only)
- **Nomba API** — Virtual accounts, payments, reconciliation
- **Hugeicons** — Icon library
