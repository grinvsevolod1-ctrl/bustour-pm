-- Починка несоответствия схемы и приложения (найдено при проверке на живой БД):
-- CHECK transfers_category_enum разрешал ('airport','railway','bus_station','city'),
-- а приложение везде использует ('airport','individual') — zod transferSaveSchema,
-- mapTransfer, форма админки и seed. Любая вставка/правка «Индивидуального»
-- трансфера падала с нарушением constraint (NOT VALID проверяет новые строки).
--
-- NOT VALID: существующие легаси-строки (если вдруг есть railway/city) не валидируются,
-- деплой не заблокируется; новые строки проверяются по правильному списку.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transfers_category_enum') THEN
    ALTER TABLE "transfers" DROP CONSTRAINT "transfers_category_enum";
  END IF;
  ALTER TABLE "transfers" ADD CONSTRAINT "transfers_category_enum"
    CHECK ("transfers"."category" IN ('airport','individual')) NOT VALID;
END $$;
