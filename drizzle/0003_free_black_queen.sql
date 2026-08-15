-- Идемпотентная миграция: снапшот drizzle отставал от реальной прод-схемы
-- (FK и часть CHECK-ов создавались через lib/db/init.ts, не через миграции),
-- поэтому каждый ADD CONSTRAINT обёрнут в проверку существования.
-- Все CHECK добавляются как NOT VALID: проверяются только новые/изменяемые
-- строки, существующие данные не могут заблокировать деплой. После ручной
-- проверки данных констрейнты можно довалидировать:
--   ALTER TABLE ... VALIDATE CONSTRAINT ...;

ALTER TABLE "certificates" ALTER COLUMN "sectionId" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tours" ALTER COLUMN "countryId" DROP DEFAULT;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_audit_log_adminId_admins_id_fk') THEN
    ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_adminId_admins_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'certificates_sectionId_cert_sections_id_fk') THEN
    ALTER TABLE "certificates" ADD CONSTRAINT "certificates_sectionId_cert_sections_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."cert_sections"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_files_folder_id_media_folders_id_fk') THEN
    ALTER TABLE "media_files" ADD CONSTRAINT "media_files_folder_id_media_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."media_folders"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tour_date_rooms_dateId_tour_dates_id_fk') THEN
    ALTER TABLE "tour_date_rooms" ADD CONSTRAINT "tour_date_rooms_dateId_tour_dates_id_fk" FOREIGN KEY ("dateId") REFERENCES "public"."tour_dates"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tour_date_tags_dateId_tour_dates_id_fk') THEN
    ALTER TABLE "tour_date_tags" ADD CONSTRAINT "tour_date_tags_dateId_tour_dates_id_fk" FOREIGN KEY ("dateId") REFERENCES "public"."tour_dates"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_countryId_countries_id_fk') THEN
    ALTER TABLE "tours" ADD CONSTRAINT "tours_countryId_countries_id_fk" FOREIGN KEY ("countryId") REFERENCES "public"."countries"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_arrivalCityId_city_destinations_id_fk') THEN
    ALTER TABLE "tours" ADD CONSTRAINT "tours_arrivalCityId_city_destinations_id_fk" FOREIGN KEY ("arrivalCityId") REFERENCES "public"."city_destinations"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "tour_dates_tour_start_idx" ON "tour_dates" USING btree ("tourId","startDate");--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'articles_category_enum') THEN
    ALTER TABLE "articles" ADD CONSTRAINT "articles_category_enum" CHECK ("articles"."category" IN ('news','special','reviews')) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'articles_content_is_json') THEN
    ALTER TABLE "articles" ADD CONSTRAINT "articles_content_is_json" CHECK ("articles"."content" IS JSON) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'buses_gallery_is_json') THEN
    ALTER TABLE "buses" ADD CONSTRAINT "buses_gallery_is_json" CHECK ("buses"."gallery" IS JSON) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'buses_documents_is_json') THEN
    ALTER TABLE "buses" ADD CONSTRAINT "buses_documents_is_json" CHECK ("buses"."documents" IS JSON) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'buses_seating_is_json') THEN
    ALTER TABLE "buses" ADD CONSTRAINT "buses_seating_is_json" CHECK ("buses"."seating" IS JSON) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'city_destinations_category_enum') THEN
    ALTER TABLE "city_destinations" ADD CONSTRAINT "city_destinations_category_enum" CHECK ("city_destinations"."category" IN ('bus','avia','hot')) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'city_destinations_sections_is_json') THEN
    ALTER TABLE "city_destinations" ADD CONSTRAINT "city_destinations_sections_is_json" CHECK ("city_destinations"."sections" IS JSON) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_blocks_extra_is_json') THEN
    ALTER TABLE "content_blocks" ADD CONSTRAINT "content_blocks_extra_is_json" CHECK ("content_blocks"."extra" IS JSON) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'countries_category_enum') THEN
    ALTER TABLE "countries" ADD CONSTRAINT "countries_category_enum" CHECK ("countries"."category" IN ('bus','avia','hot')) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'currencies_rate_positive') THEN
    ALTER TABLE "currencies" ADD CONSTRAINT "currencies_rate_positive" CHECK ("currencies"."rate" > 0) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_show_on_is_json') THEN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_show_on_is_json" CHECK ("reviews"."showOn" IS JSON) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tour_date_rooms_price_nonneg') THEN
    ALTER TABLE "tour_date_rooms" ADD CONSTRAINT "tour_date_rooms_price_nonneg" CHECK ("tour_date_rooms"."price" >= 0) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tour_date_rooms_discount_range') THEN
    ALTER TABLE "tour_date_rooms" ADD CONSTRAINT "tour_date_rooms_discount_range" CHECK ("tour_date_rooms"."discount" >= 0 AND "tour_date_rooms"."discount" <= 100) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tour_dates_extra_price_nonneg') THEN
    ALTER TABLE "tour_dates" ADD CONSTRAINT "tour_dates_extra_price_nonneg" CHECK ("tour_dates"."extraPriceAmount" >= 0) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tour_dates_start_iso') THEN
    ALTER TABLE "tour_dates" ADD CONSTRAINT "tour_dates_start_iso" CHECK ("tour_dates"."startDate" = '' OR "tour_dates"."startDate" ~ '^\d{4}-\d{2}-\d{2}$') NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tour_dates_end_iso') THEN
    ALTER TABLE "tour_dates" ADD CONSTRAINT "tour_dates_end_iso" CHECK ("tour_dates"."endDate" = '' OR "tour_dates"."endDate" ~ '^\d{4}-\d{2}-\d{2}$') NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_extra_price_amount_nonneg') THEN
    ALTER TABLE "tours" ADD CONSTRAINT "tours_extra_price_amount_nonneg" CHECK ("tours"."extraPriceAmount" >= 0) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_nights_nonneg') THEN
    ALTER TABLE "tours" ADD CONSTRAINT "tours_nights_nonneg" CHECK ("tours"."nights" >= 0) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_category_enum') THEN
    ALTER TABLE "tours" ADD CONSTRAINT "tours_category_enum" CHECK ("tours"."category" IN ('bus','avia','hot')) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_program_is_json') THEN
    ALTER TABLE "tours" ADD CONSTRAINT "tours_program_is_json" CHECK ("tours"."program" IS JSON) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_included_is_json') THEN
    ALTER TABLE "tours" ADD CONSTRAINT "tours_included_is_json" CHECK ("tours"."included" IS JSON) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_excluded_is_json') THEN
    ALTER TABLE "tours" ADD CONSTRAINT "tours_excluded_is_json" CHECK ("tours"."excluded" IS JSON) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_what_included_is_json') THEN
    ALTER TABLE "tours" ADD CONSTRAINT "tours_what_included_is_json" CHECK ("tours"."whatIncluded" IS JSON) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_gallery_is_json') THEN
    ALTER TABLE "tours" ADD CONSTRAINT "tours_gallery_is_json" CHECK ("tours"."gallery" IS JSON) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_dates_table_is_json') THEN
    ALTER TABLE "tours" ADD CONSTRAINT "tours_dates_table_is_json" CHECK ("tours"."datesTable" IS JSON) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_documents_is_json') THEN
    ALTER TABLE "tours" ADD CONSTRAINT "tours_documents_is_json" CHECK ("tours"."documents" IS JSON) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tours_layout_is_json') THEN
    ALTER TABLE "tours" ADD CONSTRAINT "tours_layout_is_json" CHECK ("tours"."layout" IS JSON) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transfers_price_roundtrip_nonneg') THEN
    ALTER TABLE "transfers" ADD CONSTRAINT "transfers_price_roundtrip_nonneg" CHECK ("transfers"."priceRoundTrip" >= 0) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transfers_price_oneway_nonneg') THEN
    ALTER TABLE "transfers" ADD CONSTRAINT "transfers_price_oneway_nonneg" CHECK ("transfers"."priceOneWay" >= 0) NOT VALID;
  END IF;
END $$;--> statement-breakpoint

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transfers_category_enum') THEN
    ALTER TABLE "transfers" ADD CONSTRAINT "transfers_category_enum" CHECK ("transfers"."category" IN ('airport','railway','bus_station','city')) NOT VALID;
  END IF;
END $$;
