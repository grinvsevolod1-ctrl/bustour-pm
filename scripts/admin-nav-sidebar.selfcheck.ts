/**
 * Admin sidebar accordion + dark shell wiring.
 * Run: npx tsx scripts/admin-nav-sidebar.selfcheck.ts
 */
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "path"
import { fileURLToPath } from "node:url"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
// Рендер сайдбара — admin-nav.tsx; ДАННЫЕ дерева (группы, ссылки, лейблы)
// переехали в admin-nav-tree.ts. Структурные проверки — по рендеру,
// проверки данных — по дереву.
const src = fs.readFileSync(path.join(root, "components/admin/admin-nav.tsx"), "utf8")
const tree = fs.readFileSync(path.join(root, "components/admin/admin-nav-tree.ts"), "utf8")

// Структура и поведение (рендер-компонент)
assert.match(src, /bg-\[#1E232A\]|#1E232A/)
assert.match(src, /bustour-admin-nav-open/)
assert.match(src, /Открыть сайт/)
assert.match(src, /target="_blank"/)
assert.match(src, /logoutAction/)
assert.match(src, /badge === ['"]leads['"]/)
assert.match(src, /bg-red-500/)
assert.match(src, /bg-blue-600/)
assert.match(src, /overflow-y-auto/)
assert.match(src, /aria-expanded/)
assert.match(src, /motion-reduce:transition-none/)

// Данные навигации (дерево)
assert.match(tree, /Операции/)
assert.match(tree, /Каталог и туры/)
assert.match(tree, /Контент и SEO/)
assert.match(tree, /Управление/)
assert.match(tree, /Автобусные туры/)
assert.match(tree, /\/admin\/tours/)
assert.match(tree, /\/admin\/pages\/bus-home/)
assert.match(tree, /\/admin\/leads/)

console.log("admin-nav-sidebar.selfcheck: ok")
