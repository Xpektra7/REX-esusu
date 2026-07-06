# Esusu API Contracts (backend checklist)

Prefix: `/api/v1` | Response: `{ code, description, data }` | Auth: Bearer

**🔴 = needs backend implementation**

| Status | Group | Method | Path | Request | Response |
|--------|-------|--------|------|---------|----------|
| 🔴 | Auth | POST | /auth/change-password | currentPassword, newPassword | {} |
| 🔴 | Auth | POST | /auth/change-pin | currentPin, newPin | {} |
| 🔴 | Users | DELETE | /users/me | password | {}. Block if active debts |
| 🔴 | Settings | GET,PATCH | /users/settings | - / partial toggles | autoPay, pushEnabled, 4 reminders, 8 notif toggles |
| 🔴 | Circles | POST | /circles/:id/remind | - | notified count |
| 🔴 | Contact | POST | /contact | name, email, subject, message | {} |
| 🔴 | Notifs | POST | /notifications/send-remind | memberName, amountKobo, cycle | {} |
| 🔴 | Activity | GET | /activity | - | items[{type, description, amountKobo?, createdAt}] |

**Summary:** 8 need backend 🔴
