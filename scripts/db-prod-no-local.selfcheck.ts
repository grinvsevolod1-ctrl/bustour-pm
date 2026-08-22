import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Контракт: приложение работает ТОЛЬКО с PostgreSQL и обязано падать
 * (fail-closed) при отсутствии/неверном DATABASE_URL — никаких фолбэков
 * на локальный файл.
 *
 * Селфчек переписан: прежняя версия проверяла старую SQLite-архитектуру
 * (`return file:...app.db` в dev + throw только в production) и падала на
 * живом коде. Текущий lib/db/index.ts даёт БОЛЕЕ строгую гарантию — throw
 * в любом окружении.
 */
const root = process.cwd()
const src = readFileSync(join(root, "lib/db/index.ts"), "utf8")
const codeOnly = src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")

// 1. Пустой DATABASE_URL => throw (в любом окружении, не только production).
assert.match(
  codeOnly,
  /if\s*\(!raw\)\s*\{\s*throw\s+new\s+Error/,
  "lib/db/index.ts must throw when DATABASE_URL is missing",
)

// 2. Не-PostgreSQL URL => throw (защита от случайного sqlite/file/mysql URL).
assert.match(
  codeOnly,
  /postgres\(ql\)\?:\\\/\\\/|\^postgres/,
  "lib/db/index.ts must validate that DATABASE_URL is a PostgreSQL URL",
)

// 3. Никаких фолбэков на локальный файл — ни в dev, ни в production.
assert.doesNotMatch(codeOnly, /return\s*[`'"]file:/, "no local file fallback allowed")
assert.ok(!codeOnly.includes("better-sqlite3"), "no sqlite driver imports allowed")

// 4. Отсутствие URL не должно деградировать до console.warn вместо throw.
assert.ok(
  !/if\s*\(!raw\)\s*\{[^}]*console\.warn/.test(codeOnly),
  "missing DATABASE_URL must throw, not warn",
)

console.log("db-prod-no-local checks passed")
