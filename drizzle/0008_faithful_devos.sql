ALTER TABLE "articles" DROP CONSTRAINT "articles_category_enum";--> statement-breakpoint
ALTER TABLE "media_files" ADD COLUMN "author" text;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_enum" CHECK ("articles"."category" IN ('news','special','reviews','helpful'));