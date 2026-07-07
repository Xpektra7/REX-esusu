CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" varchar(20) NOT NULL,
	"otp" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "circles" ADD COLUMN "allow_mid_cycle_join" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "members_circles" ADD COLUMN "joined_at_cycle" integer;--> statement-breakpoint
CREATE INDEX "idx_otp_phone_expires" ON "otp_codes" USING btree ("phone","expires_at");