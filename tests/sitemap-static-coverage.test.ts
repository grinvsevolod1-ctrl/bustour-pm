import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

// Страховка от повторения истории с «Памятками туристу»: новая статическая
// страница в app/(site) обязана попасть в staticRoutes sitemap.ts.
// Динамические сегменты ([slug]) покрываются запросами к БД и здесь не проверяются.
const SITE_DIR = path.join(process.cwd(), "app", "(site)")

// Разделы, чей публичный путь переименовывается из админки (avia-slug) —
// в sitemap они идут через переменную, а не строкой.
const DYNAMIC_PREFIX_ROUTES = new Set(["/aviatory"])

function collectStaticRoutes(dir: string, base = ""): string[] {
  const routes: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith("[") || entry.name.startsWith("_")) continue
    const segment = entry.name.startsWith("(") ? "" : `/${entry.name}`
    const full = path.join(dir, entry.name)
    if (fs.existsSync(path.join(full, "page.tsx"))) routes.push(base + segment)
    routes.push(...collectStaticRoutes(full, base + segment))
  }
  return routes
}

describe("sitemap: статические страницы", () => {
  it("каждая статическая страница сайта есть в staticRoutes", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app", "sitemap.ts"), "utf8")
    const missing = collectStaticRoutes(SITE_DIR)
      .filter((r) => r && !DYNAMIC_PREFIX_ROUTES.has(r))
      .filter((r) => !source.includes(`"${r}"`))
    expect(missing).toEqual([])
  })
})
