/**
 * Страж от повторения уже исправленных проблем (отзывы, индексация, таблицы).
 * Падает, если кто-то откатит защиту в коде.
 */
import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { sanitizeCmsHtml, wrapTablesForScroll } from "@/lib/sanitize-html"

const root = process.cwd()
const read = (p: string) => readFileSync(join(root, p), "utf8")

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(join(root, dir))) {
    const rel = join(dir, name)
    if (statSync(join(root, rel)).isDirectory()) walk(rel, out)
    else if (name === "page.tsx") out.push(rel)
  }
  return out
}

// 1. Таблицы из CMS всегда в скролл-контейнере, в любом блоке, без двойной обёртки.
{
  const html = sanitizeCmsHtml("<p>x</p><table><tr><td>a</td></tr></table><table><tr><td>b</td></tr></table>")
  assert.equal(html.match(/<div class="table-scroll">/g)?.length, 2, "каждая таблица должна быть обёрнута")
  assert.equal(wrapTablesForScroll(html), html, "обёртка должна быть идемпотентной")
  assert.equal(sanitizeCmsHtml(html), html, "повторная санитизация не должна плодить обёртки")
  const css = read("app/globals.css")
  assert.match(css, /^\.table-scroll \{/m, "стили .table-scroll должны быть глобальными, не только в .prose-content")
  assert.doesNotMatch(read("components/site/rich-content.tsx"), /replace\(\/<table/, "не оборачивать таблицы вручную — это делает sanitizeCmsHtml")
}

// 2. Отзывы: переименование тура переносит отзывы; админка предупреждает о скрытой секции.
{
  assert.match(read("lib/queries/tours.ts"), /update\(reviews\)\.set\(\{ tour: newTitle \}\)/, "каскад переименования отзывов удалён")
  assert.match(read("components/admin/tour-layout-builder.tsx"), /ReviewsSectionWarning/, "предупреждение о скрытых отзывах удалено")
  assert.match(read("app/admin/(protected)/tours/[id]/page.tsx"), /approvedReviewsCount=/, "админка тура не передаёт число отзывов")
}

// 3. Индексация: динамические страницы каталога отдают legacy-301 вместо голого 404.
{
  const sections = ["app/(site)/avtobusnye-tury", "app/(site)/aviatory", "app/(site)/hot"]
  for (const page of sections.flatMap((d) => walk(d))) {
    const isDynamic = page.includes("[")
    if (!isDynamic) continue
    const src = read(page)
    assert.doesNotMatch(src, /(?<!legacy)\bnotFound\(\)/i, `${page}: используйте legacyNotFound(...) вместо notFound()`)
  }
}

// 4. Индексация: www и http → строго https://bus-tour.by (без дублей для Google).
{
  const nginx = read("ops/nginx/apply.sh")
  assert.match(nginx, /\$host != \\"\$BARE\\"/, "nginx: пропал 301 с www на голый домен")
  assert.doesNotMatch(nginx, /return 301 https:\/\/\\\$host/, "nginx: редирект на $host сохраняет www-дубль")
}

console.log("regressions selfcheck: ok")
