/**
 * Чтение и точечное обновление .env без потери комментариев и порядка строк.
 * Используется шагами деплоя (sealed-env.mjs, integrations-bootstrap.mjs),
 * поэтому — чистый Node без зависимостей (запускается до `npm ci`).
 *
 * На сервере .env читают ТРИ разных парсера: bash (`. ./.env` в deploy.sh),
 * ecosystem.config.cjs (pm2) и @next/env (dotenv). «Сложные» значения
 * (пробелы, `<адрес>`, `!`, `$`, `#`) поэтому всегда пишем в одинарных
 * кавычках: bash не примет `<...>` за редирект и не подставит `$VAR`,
 * а pm2/dotenv одинарные кавычки просто снимают.
 */
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"

const SIMPLE_VALUE_RE = /^[A-Za-z0-9_./:@+,%-]*$/
const LINE_RE = /^(\s*)(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/

export const MANAGED_BLOCK_MARKER =
  "# --- Добавлено автоматически при деплое (scripts/sealed-env.mjs, integrations-bootstrap.mjs) ---"

export function formatEnvValue(value) {
  const str = String(value)
  if (SIMPLE_VALUE_RE.test(str)) return str
  // Апостроф внутри значения: закрыть кавычку, экранировать, открыть снова.
  // ecosystem.config.cjs такую последовательность не разворачивает, но для
  // секретов интеграций апострофов нет; при необходимости читать через dotenv.
  return `'${str.replace(/'/g, `'\\''`)}'`
}

export function unquoteEnvValue(raw) {
  const v = raw.trim()
  if (v.length >= 2 && v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/'\\''/g, "'")
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1)
  return v
}

/** KEY=VALUE → объект. Комментарии и пустые строки пропускаются. */
export function parseEnvText(text) {
  const out = {}
  for (const line of text.split(/\r?\n/)) {
    if (line.trim().startsWith("#")) continue
    const m = LINE_RE.exec(line)
    if (!m) continue
    out[m[2]] = unquoteEnvValue(m[3])
  }
  return out
}

/**
 * Обновляет/добавляет ключи в тексте .env. Существующие строки заменяются на
 * месте (все активные вхождения ключа), отсутствующие дописываются в конец
 * одним блоком под маркером. Возвращает новый текст и список изменений
 * вида { key, status: "added" | "updated" | "unchanged" } — без значений,
 * чтобы результат можно было безопасно выводить в лог деплоя.
 */
export function upsertEnvText(text, values) {
  const lines = text.replace(/\r\n/g, "\n").split("\n")
  const wanted = new Map(Object.entries(values).map(([k, v]) => [k, String(v)]))
  const status = new Map()

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("#")) continue
    const m = LINE_RE.exec(lines[i])
    if (!m || !wanted.has(m[2])) continue
    const key = m[2]
    const next = wanted.get(key)
    if (unquoteEnvValue(m[3]) === next) {
      if (!status.has(key)) status.set(key, "unchanged")
      continue
    }
    lines[i] = `${key}=${formatEnvValue(next)}`
    status.set(key, "updated")
  }

  const missing = [...wanted].filter(([key]) => !status.has(key))
  if (missing.length) {
    while (lines.length && lines[lines.length - 1] === "") lines.pop()
    if (lines.length) lines.push("")
    if (!lines.includes(MANAGED_BLOCK_MARKER)) lines.push(MANAGED_BLOCK_MARKER)
    for (const [key, val] of missing) {
      lines.push(`${key}=${formatEnvValue(val)}`)
      status.set(key, "added")
    }
    lines.push("")
  }

  return {
    text: lines.join("\n"),
    changes: [...wanted.keys()].map((key) => ({ key, status: status.get(key) })),
  }
}

/** Читает .env (или пустоту, если файла нет). */
export function readEnvFile(file) {
  return existsSync(file) ? readFileSync(file, "utf8") : ""
}

/**
 * Применяет upsert к файлу, сохраняя его права (или 0600 для нового файла —
 * в .env лежат секреты). Ничего не пишет, если изменений нет.
 */
export function upsertEnvFile(file, values) {
  const before = readEnvFile(file)
  const { text, changes } = upsertEnvText(before, values)
  if (text !== before) {
    const mode = existsSync(file) ? statSync(file).mode & 0o777 : 0o600
    writeFileSync(file, text, { encoding: "utf8", mode })
  }
  return changes
}

/** Итог для лога: «KEY (добавлено), KEY2 (обновлено), KEY3 (без изменений)». */
export function describeChanges(changes) {
  const label = { added: "добавлено", updated: "обновлено", unchanged: "без изменений" }
  return changes.map((c) => `${c.key} (${label[c.status] ?? c.status})`).join(", ")
}
