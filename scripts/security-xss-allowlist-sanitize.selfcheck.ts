/**
 * Страж от stored XSS через dangerouslySetInnerHTML.
 *
 * Раньше тут был жёсткий список из 4 файлов — из-за этого новые места рендера
 * CMS-HTML (program-timeline, tours-listing) проскочили без санитайза.
 * Теперь сканируем ВЕСЬ app/ и components/: каждое использование
 * dangerouslySetInnerHTML обязано проходить через один из безопасных путей:
 *   - sanitizeCmsHtml(...)  — CMS/пользовательский HTML;
 *   - serializeJsonLd(...)  — JSON-LD (экранирует "<" как \u003c);
 *   - явный strip тегов .replace(/<[^>]+>/g, ...) — plain-text превью.
 * Любое другое использование валит проверку.
 *
 * Run: npx tsx scripts/security-xss-allowlist-sanitize.selfcheck.ts
 */
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()

// ── Хелпер существует и делает то, что обещает ─────────────────────────
const helper = readFileSync(join(root, "lib/sanitize-html.ts"), "utf8")
assert.match(helper, /export function sanitizeCmsHtml\(/)
assert.match(helper, /<script|on\[a-z\]\+\s\*=|javascript:|style/)
assert.match(helper, /noopener noreferrer/, "sanitizeCmsHtml must inject rel=noopener for <a href>")

// ── Полный скан рендер-кода ────────────────────────────────────────────
function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue
      walk(full, acc)
    } else if (/\.(tsx|ts)$/.test(name)) {
      acc.push(full)
    }
  }
  return acc
}

const files = [...walk(join(root, "app")), ...walk(join(root, "components"))]

const SAFE_WRAPPER_RE =
  /dangerouslySetInnerHTML=\{\{\s*(?:\/\/[^\n]*\n\s*)?__html:\s*(?:sanitizeCmsHtml\(|serializeJsonLd\(|[a-zA-Z0-9_.]+\s*\.replace\(\/<\[\^>\]\+>\/g)/

const violations: string[] = []
let usages = 0

for (const file of files) {
  const src = readFileSync(file, "utf8")
  if (!src.includes("dangerouslySetInnerHTML")) continue
  // Разбираем каждое вхождение отдельно: в файле может быть и safe, и unsafe.
  const re = /dangerouslySetInnerHTML=\{\{[\s\S]{0,240}?\}\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    usages++
    if (!SAFE_WRAPPER_RE.test(m[0])) {
      const line = src.slice(0, m.index).split("\n").length
      violations.push(`${file.replace(root + "/", "")}:${line} → ${m[0].split("\n").map((s) => s.trim()).join(" ").slice(0, 120)}`)
    }
  }
}

assert.ok(usages >= 10, `expected to find dangerouslySetInnerHTML usages across the repo, found ${usages} — scan is broken?`)
assert.deepEqual(
  violations,
  [],
  `unsanitized dangerouslySetInnerHTML found — оберни в sanitizeCmsHtml()/serializeJsonLd():\n${violations.join("\n")}`,
)

// ── Ключевые рендеры CMS-HTML по-прежнему санитайзятся ────────────────
for (const rel of [
  "components/site/rich-content.tsx",
  "components/site/info-tabs-content.tsx",
  "components/site/resort-comparison-table.tsx",
  "components/site/faq.tsx",
  "components/site/program-timeline.tsx",
  "components/site/tours-listing.tsx",
]) {
  const src = readFileSync(join(root, rel), "utf8")
  if (src.includes("dangerouslySetInnerHTML")) {
    assert.match(src, /sanitizeCmsHtml\(/, `${rel} must sanitize CMS HTML`)
  }
}

console.log(`security-xss-allowlist-sanitize checks passed (${usages} usages scanned)`)
