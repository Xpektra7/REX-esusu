ALTER TABLE "circles" ADD COLUMN "capacity_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "circles" ADD COLUMN "max_members" integer;
