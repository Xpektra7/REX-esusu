import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    pinHash: text("pin_hash"),
    bvnEncrypted: text("bvn_encrypted"),
    bvnLast4: varchar("bvn_last4", { length: 4 }),
    trustScore: integer("trust_score").default(50).notNull(),
    loginAttempts: integer("login_attempts").default(0).notNull(),
    lockedUntil: timestamp("locked_until"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_users_phone").on(table.phone),
    index("idx_users_email").on(table.email),
  ],
);

export const circles = pgTable(
  "circles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => users.id),
    name: varchar("name", { length: 255 }).notNull(),
    contributionAmountKobo: integer("contribution_amount_kobo").notNull(),
    frequency: varchar("frequency", { length: 20 }).notNull(),
    cyclePeriodDays: integer("cycle_period_days").notNull(),
    cycleCount: integer("cycle_count").notNull(),
    currentCycle: integer("current_cycle").default(0).notNull(),
    defaultResolutionRule: varchar("default_resolution_rule", { length: 20 })
      .default("absorb")
      .notNull(),
    gracePeriodHours: integer("grace_period_hours").default(24).notNull(),
    allowMidCycleJoin: boolean("allow_mid_cycle_join").default(false).notNull(),
    capacityEnabled: boolean("capacity_enabled").default(false).notNull(),
    maxMembers: integer("max_members"),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_circles_creator").on(table.creatorId),
    index("idx_circles_status").on(table.status),
  ],
);

export const membersCircles = pgTable(
  "members_circles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    circleId: uuid("circle_id")
      .notNull()
      .references(() => circles.id),
    role: varchar("role", { length: 20 }).default("member").notNull(),
    status: varchar("status", { length: 20 }).default("invited").notNull(),
    rotationOrder: integer("rotation_order"),
    joinedAtCycle: integer("joined_at_cycle"),
    missedCycles: integer("missed_cycles").default(0).notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    leftAt: timestamp("left_at"),
  },
  (table) => [
    index("idx_members_user").on(table.userId),
    index("idx_members_circle").on(table.circleId),
    index("idx_members_user_circle_status").on(
      table.userId,
      table.circleId,
      table.status,
    ),
  ],
);

export const virtualAccounts = pgTable(
  "virtual_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    circleId: uuid("circle_id"),
    type: varchar("type", { length: 20 }).default("personal").notNull(),
    accountNumber: varchar("account_number", { length: 20 }).unique().notNull(),
    accountName: varchar("account_name", { length: 255 }).notNull(),
    bankCode: varchar("bank_code", { length: 50 }),
    accountRef: varchar("account_ref", { length: 255 }),
    currency: varchar("currency", { length: 3 }).default("NGN").notNull(),
    balanceKobo: integer("balance_kobo").default(0).notNull(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_va_user").on(table.userId),
    index("idx_va_account_number").on(table.accountNumber),
  ],
);

export const cycles = pgTable(
  "cycles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    circleId: uuid("circle_id")
      .notNull()
      .references(() => circles.id),
    recipientMemberId: uuid("recipient_member_id")
      .notNull()
      .references(() => membersCircles.id),
    cycleNumber: integer("cycle_number").notNull(),
    expectedTotalKobo: integer("expected_total_kobo").notNull(),
    actualTotalKobo: integer("actual_total_kobo").default(0).notNull(),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    startsAt: timestamp("starts_at").notNull(),
    deadlineAt: timestamp("deadline_at").notNull(),
    closedAt: timestamp("closed_at"),
  },
  (table) => [
    index("idx_cycles_circle_status").on(table.circleId, table.status),
    index("idx_cycles_recipient").on(table.recipientMemberId),
  ],
);

export const contributions = pgTable(
  "contributions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberCircleId: uuid("member_circle_id")
      .notNull()
      .references(() => membersCircles.id),
    cycleId: uuid("cycle_id")
      .notNull()
      .references(() => cycles.id),
    virtualAccountId: uuid("virtual_account_id").references(
      () => virtualAccounts.id,
    ),
    amountKobo: integer("amount_kobo").notNull(),
    appliedKobo: integer("applied_kobo").default(0).notNull(),
    status: varchar("status", { length: 30 }).default("pending").notNull(),
    nombaTransactionRef: varchar("nomba_transaction_ref", {
      length: 255,
    }).unique(),
    ourReference: varchar("our_reference", { length: 255 }).unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    reconciledAt: timestamp("reconciled_at"),
  },
  (table) => [
    index("idx_contributions_member_cycle").on(
      table.memberCircleId,
      table.cycleId,
    ),
    index("idx_contributions_status").on(table.status),
    index("idx_contributions_nomba_ref").on(table.nombaTransactionRef),
    index("idx_contributions_our_ref").on(table.ourReference),
  ],
);

export const debts = pgTable(
  "debts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cycleId: uuid("cycle_id")
      .notNull()
      .references(() => cycles.id),
    debtorMemberId: uuid("debtor_member_id")
      .notNull()
      .references(() => membersCircles.id),
    creditorMemberId: uuid("creditor_member_id")
      .notNull()
      .references(() => membersCircles.id),
    amountKobo: integer("amount_kobo").notNull(),
    paidKobo: integer("paid_kobo").default(0).notNull(),
    fineKobo: integer("fine_kobo").default(0).notNull(),
    status: varchar("status", { length: 20 }).default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    clearedAt: timestamp("cleared_at"),
  },
  (table) => [
    index("idx_debts_debtor_status").on(table.debtorMemberId, table.status),
    index("idx_debts_creditor").on(table.creditorMemberId),
    index("idx_debts_cycle").on(table.cycleId),
  ],
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    otp: varchar("otp", { length: 6 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_otp_email_expires").on(table.email, table.expiresAt)],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    nombaRequestId: varchar("nomba_request_id", { length: 255 })
      .unique()
      .notNull(),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    rawPayload: jsonb("raw_payload").notNull(),
    status: varchar("status", { length: 20 }).default("received").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    processedAt: timestamp("processed_at"),
  },
  (table) => [index("idx_webhooks_nomba_request_id").on(table.nombaRequestId)],
);

export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referrerUserId: uuid("referrer_user_id")
      .notNull()
      .references(() => users.id),
    referredUserId: uuid("referred_user_id")
      .notNull()
      .references(() => users.id),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    bonusKobo: integer("bonus_kobo").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_referrals_referrer").on(table.referrerUserId),
    index("idx_referrals_referred").on(table.referredUserId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    data: jsonb("data"),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_notifications_user_read").on(table.userId, table.read),
    index("idx_notifications_user_created").on(table.userId, table.createdAt),
  ],
);

export const inviteCodes = pgTable(
  "invite_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    circleId: uuid("circle_id")
      .notNull()
      .references(() => circles.id),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    code: varchar("code", { length: 20 }).unique().notNull(),
    maxUses: integer("max_uses"),
    useCount: integer("use_count").default(0).notNull(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_invite_codes_circle").on(table.circleId)],
);

export const payoutTransactions = pgTable(
  "payout_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cycleId: uuid("cycle_id")
      .notNull()
      .references(() => cycles.id),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => users.id),
    amountKobo: integer("amount_kobo").notNull(),
    nombaTransferRef: varchar("nomba_transfer_ref", { length: 255 }),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    nombaResponse: jsonb("nomba_response"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("idx_payouts_cycle").on(table.cycleId),
    index("idx_payouts_recipient").on(table.recipientUserId),
  ],
);

export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 30 }).notNull(),
    amountKobo: integer("amount_kobo").notNull(),
    reference: varchar("reference", { length: 255 }).unique(),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_wallet_tx_user").on(table.userId),
    index("idx_wallet_tx_user_created").on(table.userId, table.createdAt),
    index("idx_wallet_tx_type").on(table.type),
    index("idx_wallet_tx_status").on(table.status),
    index("idx_wallet_tx_reference").on(table.reference),
  ],
);

export const userSettings = pgTable(
  "user_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id)
      .unique(),
    autoPay: boolean("auto_pay").default(false).notNull(),
    pushEnabled: boolean("push_enabled").default(true).notNull(),
    reminderDueDate: boolean("reminder_due_date").default(true).notNull(),
    reminderCycleStart: boolean("reminder_cycle_start").default(true).notNull(),
    reminderPaymentConfirm: boolean("reminder_payment_confirm")
      .default(true)
      .notNull(),
    reminderDebt: boolean("reminder_debt").default(true).notNull(),
    notifContribution: boolean("notif_contribution").default(true).notNull(),
    notifPayout: boolean("notif_payout").default(true).notNull(),
    notifDebt: boolean("notif_debt").default(true).notNull(),
    notifCycle: boolean("notif_cycle").default(true).notNull(),
    notifMember: boolean("notif_member").default(true).notNull(),
    notifReferral: boolean("notif_referral").default(true).notNull(),
    notifSystem: boolean("notif_system").default(true).notNull(),
    notifPromo: boolean("notif_promo").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_user_settings_user").on(table.userId)],
);

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_contact_messages_created").on(table.createdAt)],
);
