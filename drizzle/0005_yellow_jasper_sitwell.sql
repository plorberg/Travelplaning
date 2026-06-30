ALTER TABLE "stops" ADD COLUMN IF NOT EXISTS "highlights" text;--> statement-breakpoint
ALTER TABLE "stops" ADD COLUMN IF NOT EXISTS "leg_distance_km" numeric(8, 1);--> statement-breakpoint
ALTER TABLE "stops" ADD COLUMN IF NOT EXISTS "leg_drive_minutes" integer;