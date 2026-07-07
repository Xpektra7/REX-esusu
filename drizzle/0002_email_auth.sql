ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "otp_codes" RENAME COLUMN "phone" TO "email";
ALTER TABLE "otp_codes" ALTER COLUMN "email" TYPE varchar(255);
DROP INDEX IF EXISTS "idx_otp_phone_expires";
CREATE INDEX "idx_otp_email_expires" ON "otp_codes" USING btree ("email", "expires_at");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" USING btree ("email");
