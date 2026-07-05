# Settings Page — Design Document

**Route:** `/settings` (new page under dashboard route group)
**Auth required:** Yes
**Components needed:** 5 new + 1 updated nav link

---

## Page Layout

```
┌────────────────────────────────────────────┐
│  ← Back     Settings                       │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ Payment Preferences                  │  │
│  │                                      │  │
│  │  ┌──────────────────────────────┐   │  │
│  │  │ Auto-pay                  ╭──╮│   │  │
│  │  │ Auto-debit from VA when   │ ✓││   │  │
│  │  │ contribution is due       ╰──╯│   │  │
│  │  └──────────────────────────────┘   │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ Notifications                        │  │
│  │                                      │  │
│  │  ┌──────────────────────────────┐   │  │
│  │  │ Push notifications     ╭──╮ │   │  │
│  │  │                        │ ✓│ │   │  │
│  │  │                        ╰──╯ │   │  │
│  │  └──────────────────────────────┘   │  │
│  │                                      │  │
│  │  Reminder timing:                    │  │
│  │  ☑ 24 hours before deadline          │  │
│  │  ☑ 6 hours before deadline           │  │
│  │  ☑ At deadline                       │  │
│  │  ☐ After grace expires               │  │
│  │                                      │  │
│  │  Notification types:                 │  │
│  │  ☑ Payment received                  │  │
│  │  ☑ Debt cleared                      │  │
│  │  ☑ Cycle reminders                   │  │
│  │  ☑ Payout sent/received              │  │
│  │  ☑ Default alerts                    │  │
│  │  ☑ Circle invites                    │  │
│  │  ☑ Trust score changes               │  │
│  │  ☑ Withdrawal status                 │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ Security                              │  │
│  │                                      │  │
│  │  ┌──────────────────────────────┐   │  │
│  │  │ Change PIN          ›       │   │  │
│  │  └──────────────────────────────┘   │  │
│  │  ┌──────────────────────────────┐   │  │
│  │  │ Change Password     ›       │   │  │
│  │  └──────────────────────────────┘   │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ Account                               │  │
│  │                                      │  │
│  │  Email: chioma@email.com              │  │
│  │  Phone: +234801*******                │  │
│  │                                      │  │
│  │  ┌──────────────────────────────┐   │  │
│  │  │ Delete Account     ›       │   │  │
│  │  └──────────────────────────────┘   │  │
│  └──────────────────────────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

---

## New Components Needed

### 1. `src/components/settings/auto-pay-toggle.tsx`
- Toggle switch for auto-pay
- Subtitle: "Auto-debit from wallet when contribution is due"
- Calls `api.users.settings.update({ autoPay: true/false })`
- States: loading (while saving), success (toast), error (toast)

### 2. `src/components/settings/notification-preferences.tsx`
- Master toggle: "Push notifications" (on/off)
- "Reminder timing" — checkboxes (24h, 6h, deadline, grace expiry)
- "Notification types" — list of toggles for each type
- Calls `api.users.settings.update({ ... })`

### 3. `src/components/settings/security-section.tsx`
- "Change PIN" row → links to `/auth/pin?mode=change`
  - Need new mode: verify current PIN → enter new PIN → confirm
- "Change Password" row → opens Dialog with form
  - Fields: current password, new password, confirm new password
  - API: `POST /api/v1/auth/change-password`
  - Validates: new !== current, meets passwordSchema

### 4. `src/components/settings/account-section.tsx`
- Email row: display current, "Change" opens Dialog with OTP flow
- Phone row: display masked, "Cannot change — contact support" message
- "Delete Account" row → opens confirm Dialog
  - Confirm: type "DELETE" to confirm, enter password
  - API: `DELETE /api/v1/users/me`
  - On success: `clearAuth()`, redirect to landing

### 5. `src/components/settings/delete-account-dialog.tsx`
- Warning text: "This action is irreversible..."
- Input: type "DELETE" to confirm
- Input: current password
- Red destructive button
- States: loading, error (wrong password), success → logout

### 6. Update `src/components/layout/side-nav.tsx`
- Add "Settings" link to nav below Profile

---

## API Endpoints

### New Endpoints

| Method | Path | Purpose | Mock needed? |
|--------|------|---------|-------------|
| GET | `/users/settings` | Get all settings | Yes |
| PATCH | `/users/settings` | Update settings (partial) | Yes |
| POST | `/auth/change-password` | Change password | Yes |
| DELETE | `/users/me` | Delete account | Yes |
| POST | `/auth/change-pin` | Change PIN (verify old, set new) | Yes |

### Request/Response Shapes

**GET /users/settings**
```json
{
  "code": "00",
  "data": {
    "autoPay": false,
    "pushEnabled": true,
    "reminder24h": true,
    "reminder6h": true,
    "reminderDeadline": true,
    "reminderGraceExpiry": false,
    "notifyPaymentReceived": true,
    "notifyDebtCleared": true,
    "notifyCycleReminders": true,
    "notifyPayout": true,
    "notifyDefaultAlert": true,
    "notifyCircleInvite": true,
    "notifyTrustScore": true,
    "notifyWithdrawal": true
  }
}
```

**PATCH /users/settings**
```json
{
  "autoPay": false,
  "pushEnabled": false
}
```
Response: `{ "code": "00", "data": { ...updated settings } }`

**POST /auth/change-password**
```json
{ "currentPassword": "OldPass1", "newPassword": "NewPass1" }
```
Response: `{ "code": "00", "description": "Password changed" }`
Error: `{ "code": "05", "description": "Current password is incorrect" }`
Error: `{ "code": "05", "description": "New password must be different" }`

**DELETE /users/me**
```json
{ "password": "MyPass1" }
```
Response: `{ "code": "00", "description": "Account deleted" }`
Error: `{ "code": "05", "description": "Password is incorrect" }`

### Existing Endpoints to Extend

- `POST /api/v1/auth/set-pin` — already exists; add `mode: "change"` that requires `currentPin` + `newPin`

---

## Database

### Option A: JSONB on users table (simpler, recommended)
```sql
ALTER TABLE users ADD COLUMN settings JSONB DEFAULT '{
  "autoPay": false,
  "pushEnabled": true,
  "reminder24h": true,
  "reminder6h": true,
  "reminderDeadline": true,
  "reminderGraceExpiry": false,
  "notifyPaymentReceived": true,
  "notifyDebtCleared": true,
  "notifyCycleReminders": true,
  "notifyPayout": true,
  "notifyDefaultAlert": true,
  "notifyCircleInvite": true,
  "notifyTrustScore": true,
  "notifyWithdrawal": true
}';
```

### Option B: Separate user_settings table (normalized)
```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  auto_pay BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  reminder_24h BOOLEAN DEFAULT true,
  reminder_6h BOOLEAN DEFAULT true,
  reminder_deadline BOOLEAN DEFAULT true,
  reminder_grace_expiry BOOLEAN DEFAULT false,
  notify_payment_received BOOLEAN DEFAULT true,
  notify_debt_cleared BOOLEAN DEFAULT true,
  notify_cycle_reminders BOOLEAN DEFAULT true,
  notify_payout BOOLEAN DEFAULT true,
  notify_default_alert BOOLEAN DEFAULT true,
  notify_circle_invite BOOLEAN DEFAULT true,
  notify_trust_score BOOLEAN DEFAULT true,
  notify_withdrawal BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Mock Data

Default settings response (always returns same defaults):
```json
{
  "autoPay": false,
  "pushEnabled": true,
  "reminder24h": true,
  "reminder6h": true,
  "reminderDeadline": true,
  "reminderGraceExpiry": false,
  "notifyPaymentReceived": true,
  "notifyDebtCleared": true,
  "notifyCycleReminders": true,
  "notifyPayout": true,
  "notifyDefaultAlert": true,
  "notifyCircleInvite": true,
  "notifyTrustScore": true,
  "notifyWithdrawal": true
}
```

---

## Navigation Update

Add to `side-nav.tsx` and `bottom-nav.tsx`:
- Desktop: settings icon below Profile link
- Mobile: settings icon in bottom nav or in profile page as link
- `/settings` route added to dashboard route group

---

## Implementation Order

1. Add settings API client methods + mock handlers in `api.ts`
2. Create DB schema (JSONB column or table)
3. Create route handler files for `/api/v1/users/settings`
4. Create settings page `/app/(dashboard)/settings/page.tsx`
5. Build components: AutoPayToggle, NotificationPreferences, SecuritySection, AccountSection, DeleteAccountDialog
6. Add to navigation (side-nav + bottom-nav)
7. Add change-password + change-pin handlers + mock
8. Add delete-account handler + mock
