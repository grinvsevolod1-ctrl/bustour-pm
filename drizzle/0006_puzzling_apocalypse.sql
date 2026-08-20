-- Вложенные папки медиатеки: self-reference parent_id + снятие глобальной
-- уникальности имени (уникальность теперь в пределах родителя, проверяется в коде).
-- Строки про transfers_category_enum намеренно убраны из авто-генерации:
-- миграция 0005 добавила этот CHECK как NOT VALID, чтобы не валидировать легаси-строки
-- на проде; повторное DROP/ADD без NOT VALID могло бы заблокировать деплой.
ALTER TABLE "media_folders" DROP CONSTRAINT IF EXISTS "media_folders_name_unique";--> statement-breakpoint
ALTER TABLE "media_folders" ADD COLUMN "parent_id" text;--> statement-breakpoint
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parent_id_media_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_folders_parent_id_idx" ON "media_folders" USING btree ("parent_id");
