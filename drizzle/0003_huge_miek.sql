CREATE TABLE IF NOT EXISTS "airports" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text,
	"country" text,
	"lat" double precision,
	"lng" double precision
);
