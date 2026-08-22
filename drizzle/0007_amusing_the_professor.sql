CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"resetAt" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "sessionVersion" integer DEFAULT 1 NOT NULL;