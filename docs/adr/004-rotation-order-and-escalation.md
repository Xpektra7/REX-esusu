# ADR 004: Rotation Order, Default Escalation, and Fee Model

**Date:** 2026-07-17

## Rotation Order

- Members sorted by trust score (highest first)
- New members with no score → automatically last in rotation
- Admin follows trust score ranking like everyone else — no special position
- Rationale: rewards reliable members with earlier payout; new members prove themselves

## Default Escalation Path

### Principles
- Recipients are paid on schedule with the pot available (not artificially delayed waiting for defaulters)
- The defaulter accumulates debt + fines
- The group absorbs bad debt socially (same as offline Ajo)

### Stages

| Stage | Trigger | System Action |
|-------|---------|---------------|
| 1 | Missed payment | Debt created. ₦500 fine added to debt. Recipient paid available pot minus defaulter's share. Notification sent. |
| 2 | Debt persists past cycle end | Member flagged "delinquent". Circle members can see flag. |
| 3 | 2+ consecutive defaults | Auto-restricted: cannot create or join new circles. Trust score penalized. |
| 4 | Admin action | Admin can: remove member (debt stays on record), write off debt (group absorbs loss), or forgive and let debt ride. |
| 5 | Full repayment | Trust score recovers gradually. Delinquent flag removed. |

### Debt and Payout Interaction

When a member defaults:
1. The cycle still closes on schedule (or when fully paid, per ADR 003)
2. The recipient receives: `(total contributions - defaulter's share)` 
3. The defaulter's debt = `(contributionAmount + ₦500 fine)`
4. Future contributions from the defaulter are applied FIFO to clear outstanding debts first

## Fee Model

| Fee Type | Amount | Purpose |
|----------|--------|---------|
| Payout fee | **1%** of pot | Main revenue stream. Paid by recipient upon receiving payout. |
| Withdrawal fee | **₦50 cap** | Covers Nomba transfer costs. Capped so high-volume users aren't penalized. |
| Circle creation | **Free** | Zero barrier to new groups. |

### Revenue Projection

`1,000 circles × 12 members × ₦100k avg pot × 1% = ₦12M/month gross`
