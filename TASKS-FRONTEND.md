# Frontend Tasks — Esusu

## Setup & Foundation (User)
- [X] `npm create next-app` with TypeScript, App Router, Tailwind, src/ directory
- [X] `npx shadcn@latest init` — pick preset
- [X] Install additional deps: zustand, @tanstack/react-query, lucide-react, sonner, date-fns
- [X] Add shadcn components as needed (button, card, input, form, dialog, sheet, table, badge, avatar, separator, toast, dropdown-menu, tabs, skeleton)
- [X] Set up globals.css with Nomba gold (#FFCC00) theme
- [ ] Create `tailwind.config.ts` with nomba color tokens
- [ ] Create `src/types/index.ts` — all TS interfaces
- [ ] Create `src/lib/utils.ts` — cn(), currency format, date format, phone/BVN masking, trust score colors
- [ ] Create `src/lib/api.ts` — fetch wrapper with JWT auth + auto-refresh on 401
- [ ] Create `src/lib/supabase.ts` — Supabase client
- [ ] Create `src/lib/nomba.ts` — Nomba API helpers (VA creation, transfers, bank lookup)
- [ ] Create `src/lib/validations.ts` — Zod schemas for all forms
- [ ] Create `src/stores/auth-store.ts` — Zustand + persist for auth state
- [ ] Create `src/hooks/use-auth.ts` — auth hooks (login, logout, refresh, PIN)
- [X] Create PWA manifest + service worker registration

## Auth Pages (User)
- [ ] Phone input page — `/(auth)/auth/page.tsx`
- [ ] OTP verification page — `/(auth)/auth/otp/page.tsx`
- [ ] PIN setup page — `/(auth)/auth/pin/page.tsx`
- [ ] Auth layout with logo + progression indicator

## Dashboard Shell (User)
- [ ] Dashboard layout — sidebar nav + top header + main content area
- [ ] Sidebar: Home, Circles, Wallet, Notifications, Profile icons + labels
- [ ] Dashboard home — `/(dashboard)/dashboard/page.tsx`
- [ ] Empty states for each section

## Wallet (User)
- [ ] Wallet page — balance card, recent transactions table, withdraw button
- [ ] Withdraw page — `/(dashboard)/wallet/withdraw/page.tsx`
- [ ] Transaction history with status badges

## Circles (User)
- [ ] Circles list page — `/(dashboard)/circles/page.tsx`
- [ ] Create circle page — `/(dashboard)/circles/new/page.tsx`
- [ ] Join circle page — `/(dashboard)/circles/[id]/join/page.tsx`
- [ ] Circle detail page — `/(dashboard)/circles/[id]/page.tsx` (members, cycles, status)
- [ ] Cycle detail — `/(dashboard)/circles/[id]/cycles/[num]/page.tsx`
- [ ] Report page — `/(dashboard)/circles/[id]/report/page.tsx` (reconciliation audit trail)

## Notifications & Profile (User)
- [ ] Notifications list page — `/(dashboard)/notifications/page.tsx`
- [ ] Profile page — `/(dashboard)/profile/page.tsx` (KYC, settings, PIN change)
- [ ] Referrals page — `/(dashboard)/referrals/page.tsx`

## Static Pages (coderheem)
- [+] Landing page — `/(public)/page.tsx`
- [+] About page — `/(public)/about/page.tsx`
- [X] FAQ page — `/(public)/faq/page.tsx`
- [+] Contact page — `/(public)/contact/page.tsx`
- [X] Terms page — `/(public)/legal/terms/page.tsx`
- [X] Privacy page — `/(public)/legal/privacy/page.tsx`
- [X] Security page — `/(public)/legal/security/page.tsx`
- [+] Public layout with header/footer

## Components
- [ ] `src/components/ui/` — base shadcn components
- [ ] `src/components/layout/` — sidebar, header, dashboard-layout, public-layout
- [ ] `src/components/auth/` — phone-input, otp-input, pin-input forms
- [ ] `src/components/wallet/` — balance-card, transaction-row, withdraw-form
- [ ] `src/components/circles/` — circle-card, circle-list, create-form, join-form, member-list, cycle-timeline, status-badge
- [ ] `src/components/contributions/` — contribute-form, contribution-history
- [ ] `src/components/payouts/` — payout-card
- [ ] `src/components/debts/` — debt-list, debt-row
- [ ] `src/components/trust-score/` — score-badge, trust-meter
- [ ] `src/components/notifications/` — notification-item, notification-list
- [ ] `src/components/referrals/` — referral-link, referral-stats
- [ ] `src/components/shared/` — loading-skeleton, empty-state, error-boundary, page-header
