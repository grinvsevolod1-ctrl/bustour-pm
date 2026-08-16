-- Миграция 0004: индексы под реальные запросы + дедупликация импорта отзывов.
-- Все операции идемпотентны (IF NOT EXISTS / DO-блоки) — безопасны при
-- дрейфе прод-схемы и повторном прогоне.

CREATE INDEX IF NOT EXISTS "admin_audit_log_created_idx" ON "admin_audit_log" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "articles_archived_created_idx" ON "articles" USING btree ("archived","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leads_archived_created_idx" ON "leads" USING btree ("archived","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transfers_archived_idx" ON "transfers" USING btree ("archived");--> statement-breakpoint

-- Перед unique-индексом убираем уже накопленные дубликаты импорта:
-- оставляем самый ранний отзыв (min id) в каждой группе (source, sourceId).
DELETE FROM "reviews" r
USING "reviews" dup
WHERE r."source" = dup."source"
  AND r."sourceId" = dup."sourceId"
  AND r."sourceId" <> ''
  AND r."id" > dup."id";--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "reviews_source_source_id_uniq" ON "reviews" USING btree ("source","sourceId") WHERE "sourceId" <> '';--> statement-breakpoint

-- NOT VALID: старые строки с нецифровым size (если есть) не заблокируют
-- деплой; новые записи проверяются сразу.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'media_files_size_numeric'
  ) THEN
    ALTER TABLE "media_files" ADD CONSTRAINT "media_files_size_numeric" CHECK ("size" ~ '^\d+$') NOT VALID;
  END IF;
END $$;
