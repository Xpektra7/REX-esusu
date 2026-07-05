# Esusu API Contracts (backend checklist)

Prefix: `/api/v1` | Response: `{ code, description, data }` | Auth: Bearer

**✅ = route handler exists | 🔴 = needs backend implementation**

| Status | Group | Method | Path | Request | Response |
|--------|-------|--------|------|---------|----------|
| ✅ | Auth | POST | /auth/send-otp | phone | expiresInSeconds, isNewUser |
| ✅ | Auth | POST | /auth/verify | phone, otp, password, name?, email?, bvn? | accessToken, refreshToken, user |
| ✅ | Auth | POST | /auth/refresh | refreshToken | accessToken, refreshToken |
| ✅ | Auth | POST | /auth/set-pin | pin, currentPassword | {} |
| ✅ | Auth | POST | /auth/verify-pin | pin | verified. Lock 5m after 3 fails |
| 🔴 | Auth | POST | /auth/change-password | currentPassword, newPassword | {} |
| 🔴 | Auth | POST | /auth/change-pin | currentPin, newPin | {} |
| ✅ | Auth | POST | /auth/verify-bvn | bvn | verified, name, dob |
| ✅ | Auth | POST | /auth/logout | - | {} |
| ✅ | Users | GET,PATCH | /users/me | - / name?, email? | profile + trustScoreBreakdown + stats |
| 🔴 | Users | DELETE | /users/me | password | {}. Block if active debts |
| 🔴 | Settings | GET,PATCH | /users/settings | - / partial toggles | autoPay, pushEnabled, 4 reminders, 8 notif toggles |
| ✅ | Circles | GET | /circles | ?status= | circles[] with nextPayoutAmount, hasOutstandingDebt |
| ✅ | Circles | POST | /circles | name, amount, frequency, cycleCount, rule | id, inviteCode |
| ✅ | Circles | GET | /circles/:id | - | members[] with hasActiveDebt, debtAmount, debtTo |
| ✅ | Circles | POST | /circles/:id/activate | - | {}. Needs >=2 members |
| ✅ | Circles | POST | /circles/:id/join | inviteCode | {}. Error if expired/full |
| ✅ | Circles | POST | /circles/:id/invite | - | inviteCode, link, expiresAt |
| ✅ | Circles | POST | /circles/:id/leave | - | {}. Block if debts/collected |
| 🔴 | Circles | POST | /circles/:id/remind | - | notified count |
| ✅ | Circles | GET | /circles/:id/report | - | summary + members[] + cycles[] |
| ✅ | Cycles | GET | /circles/:id/cycles | - | cycle list |
| ✅ | Cycles | GET | /circles/:id/cycles/current | - | contributions with debtKobo, totalOwedKobo, gracePeriodEndsAt |
| ✅ | Cycles | GET | /circles/:id/cycles/:num | - | same shape as current |
| ✅ | Cycles | POST | /circles/:id/cycles/:num/payout | - | payoutId, amountKobo, status |
| ✅ | Cycles | POST | /cycles/:id/close | - | nextCycleNumber |
| ✅ | Contrib | POST | /contributions/initiate | cycleId, amountKobo | ourReference, virtualAccount, instructions |
| ✅ | Contrib | POST | /contributions/confirm | ref | status: pending_reconciliation |
| ✅ | Contrib | GET | /contributions/history | ?cursor=&limit= | paginated list |
| ✅ | Wallet | GET | /wallet | - | balanceKobo, virtualAccount, pendingReconciliationKobo |
| ✅ | Wallet | GET | /wallet/transactions | ?type=credit|debit&page=&limit= | transaction list |
| ✅ | Wallet | POST | /wallet/topup | amountKobo | virtualAccount, reference, instructions |
| ✅ | Wallet | POST | /wallet/withdraw | amountKobo, bankCode, accountNumber | ref, status |
| ✅ | Notifs | GET | /notifications | ?unreadOnly=&page=&limit= | list with data.url for deep-links |
| ✅ | Notifs | PATCH | /notifications/:id/read | - | {} |
| ✅ | Notifs | POST | /notifications/read-all | - | {} |
| ✅ | Bank | GET | /bank-codes | - | banks[{code, name}] |
| ✅ | Bank | POST | /bank-lookup | accountNumber, bankCode | accountName |
| ✅ | Referrals | GET | /referrals | - | code, totalReferred, completedCircle, bonusEarnedKobo |
| ✅ | Activity | GET | /activity | - | items[{type, description, amountKobo?, createdAt}] |
| ✅ | Debts | GET | /debts | - | outgoing[], incoming[] with fineKobo |
| ✅ | Debts | POST | /debts/:id/pay | - | {} |
| 🔴 | Contact | POST | /contact | name, email, subject, message | {} |
| 🔴 | Notifs | POST | /notifications/send-remind | memberName, amountKobo, cycle | {} |
| 🔴 | Circles | GET,PATCH | /circles/:id/settings | - / allowMidCycleJoin | settings + toggles |

**Summary:** 35 exist ✅ | 8 need backend 🔴

- `/auth/change-password`
- `/auth/change-pin`
- `DELETE /users/me`
- `GET,PATCH /users/settings`
- `/circles/:id/remind`
- `/contact`
- `/notifications/send-remind`
- `GET,PATCH /circles/:id/settings`
ENDOFFILE