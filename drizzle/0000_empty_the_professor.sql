CREATE TABLE "circles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"contribution_amount_kobo" integer NOT NULL,
	"frequency" varchar(20) NOT NULL,
	"cycle_period_days" integer NOT NULL,
	"cycle_count" integer NOT NULL,
	"current_cycle" integer DEFAULT 0 NOT NULL,
	"default_resolution_rule" varchar(20) DEFAULT 'absorb' NOT NULL,
	"grace_period_hours" integer DEFAULT 24 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_circle_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"virtual_account_id" uuid,
	"amount_kobo" integer NOT NULL,
	"applied_kobo" integer DEFAULT 0 NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"nomba_transaction_ref" varchar(255),
	"our_reference" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reconciled_at" timestamp,
	CONSTRAINT "contributions_nomba_transaction_ref_unique" UNIQUE("nomba_transaction_ref"),
	CONSTRAINT "contributions_our_reference_unique" UNIQUE("our_reference")
);
--> statement-breakpoint
CREATE TABLE "cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"circle_id" uuid NOT NULL,
	"recipient_member_id" uuid NOT NULL,
	"cycle_number" integer NOT NULL,
	"expected_total_kobo" integer NOT NULL,
	"actual_total_kobo" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"starts_at" timestamp NOT NULL,
	"deadline_at" timestamp NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "debts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" uuid NOT NULL,
	"debtor_member_id" uuid NOT NULL,
	"creditor_member_id" uuid NOT NULL,
	"amount_kobo" integer NOT NULL,
	"paid_kobo" integer DEFAULT 0 NOT NULL,
	"fine_kobo" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"cleared_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "invite_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"circle_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"max_uses" integer,
	"use_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invite_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "members_circles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"circle_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"status" varchar(20) DEFAULT 'invited' NOT NULL,
	"rotation_order" integer,
	"missed_cycles" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"data" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"amount_kobo" integer NOT NULL,
	"nomba_transfer_ref" varchar(255),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"nomba_response" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_user_id" uuid NOT NULL,
	"referred_user_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"bonus_kobo" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"name" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"pin_hash" text,
	"bvn_encrypted" text,
	"bvn_last4" varchar(4),
	"trust_score" integer DEFAULT 50 NOT NULL,
	"login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "virtual_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"circle_id" uuid,
	"type" varchar(20) DEFAULT 'personal' NOT NULL,
	"account_number" varchar(20) NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"bank_code" varchar(50),
	"account_ref" varchar(255),
	"currency" varchar(3) DEFAULT 'NGN' NOT NULL,
	"balance_kobo" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "virtual_accounts_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(30) NOT NULL,
	"amount_kobo" integer NOT NULL,
	"reference" varchar(255),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_transactions_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nomba_request_id" varchar(255) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'received' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	CONSTRAINT "webhook_events_nomba_request_id_unique" UNIQUE("nomba_request_id")
);
--> statement-breakpoint
ALTER TABLE "circles" ADD CONSTRAINT "circles_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_member_circle_id_members_circles_id_fk" FOREIGN KEY ("member_circle_id") REFERENCES "public"."members_circles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_cycle_id_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_virtual_account_id_virtual_accounts_id_fk" FOREIGN KEY ("virtual_account_id") REFERENCES "public"."virtual_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycles" ADD CONSTRAINT "cycles_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycles" ADD CONSTRAINT "cycles_recipient_member_id_members_circles_id_fk" FOREIGN KEY ("recipient_member_id") REFERENCES "public"."members_circles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_cycle_id_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_debtor_member_id_members_circles_id_fk" FOREIGN KEY ("debtor_member_id") REFERENCES "public"."members_circles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_creditor_member_id_members_circles_id_fk" FOREIGN KEY ("creditor_member_id") REFERENCES "public"."members_circles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members_circles" ADD CONSTRAINT "members_circles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members_circles" ADD CONSTRAINT "members_circles_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_transactions" ADD CONSTRAINT "payout_transactions_cycle_id_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_transactions" ADD CONSTRAINT "payout_transactions_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_accounts" ADD CONSTRAINT "virtual_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_circles_creator" ON "circles" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_circles_status" ON "circles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_contributions_member_cycle" ON "contributions" USING btree ("member_circle_id","cycle_id");--> statement-breakpoint
CREATE INDEX "idx_contributions_status" ON "contributions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_contributions_nomba_ref" ON "contributions" USING btree ("nomba_transaction_ref");--> statement-breakpoint
CREATE INDEX "idx_contributions_our_ref" ON "contributions" USING btree ("our_reference");--> statement-breakpoint
CREATE INDEX "idx_cycles_circle_status" ON "cycles" USING btree ("circle_id","status");--> statement-breakpoint
CREATE INDEX "idx_cycles_recipient" ON "cycles" USING btree ("recipient_member_id");--> statement-breakpoint
CREATE INDEX "idx_debts_debtor_status" ON "debts" USING btree ("debtor_member_id","status");--> statement-breakpoint
CREATE INDEX "idx_debts_creditor" ON "debts" USING btree ("creditor_member_id");--> statement-breakpoint
CREATE INDEX "idx_debts_cycle" ON "debts" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "idx_invite_codes_circle" ON "invite_codes" USING btree ("circle_id");--> statement-breakpoint
CREATE INDEX "idx_members_user" ON "members_circles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_members_circle" ON "members_circles" USING btree ("circle_id");--> statement-breakpoint
CREATE INDEX "idx_members_user_circle_status" ON "members_circles" USING btree ("user_id","circle_id","status");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_read" ON "notifications" USING btree ("user_id","read");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_created" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_payouts_cycle" ON "payout_transactions" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "idx_payouts_recipient" ON "payout_transactions" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE INDEX "idx_referrals_referrer" ON "referrals" USING btree ("referrer_user_id");--> statement-breakpoint
CREATE INDEX "idx_referrals_referred" ON "referrals" USING btree ("referred_user_id");--> statement-breakpoint
CREATE INDEX "idx_users_phone" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_va_user" ON "virtual_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_va_account_number" ON "virtual_accounts" USING btree ("account_number");--> statement-breakpoint
CREATE INDEX "idx_wallet_tx_user" ON "wallet_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_wallet_tx_user_created" ON "wallet_transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_wallet_tx_type" ON "wallet_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_wallet_tx_status" ON "wallet_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_wallet_tx_reference" ON "wallet_transactions" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "idx_webhooks_nomba_request_id" ON "webhook_events" USING btree ("nomba_request_id");