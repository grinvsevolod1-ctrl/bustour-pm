// Одноразовый байт-безопасный сплит app/globals.css на три файла.
// Работает построчно через Node (UTF-8 сохраняется без потерь).
import { readFileSync, writeFileSync } from "node:fs"

const SRC = "/vercel/share/v0-project/app/globals.css"
const lines = readFileSync(SRC, "utf8").split("\n")
const L = (from, to) => lines.slice(from - 1, to) // 1-indexed inclusive

const assert = (cond, msg) => { if (!cond) throw new Error("boundary check failed: " + msg) }
assert(lines[11].startsWith("@custom-variant dark"), "12")
assert(lines[7].includes("flatpickr/dist/flatpickr.css"), "8")
assert(lines[112].startsWith(".dark {"), "113")
assert(lines[147].startsWith("@media (prefers-color-scheme: dark)"), "148")
assert(lines[251].startsWith("/* Flatpickr range calendar"), "252")
assert(lines[410].startsWith("/* ---------- Rich text"), "411")
assert(lines[622].startsWith("/*") && lines[623].includes("Admin media-grid preview"), "623")
assert(lines[687].startsWith(".prose-editor .seo-media > img,"), "688")
assert(lines[690].startsWith(".prose-content .seo-media > iframe {"), "691")
assert(lines[805].startsWith("/* Placeholder for the empty editor */"), "806")
assert(lines[846].startsWith("/* Grid cells: chooser"), "847")
assert(lines[849].startsWith(".prose-content .seo-media-grid p.is-empty::before {"), "850")
assert(lines[853].startsWith(".prose-editor .seo-media-grid-cell {"), "854")
assert(lines[862].startsWith("/* Public site: no card chrome"), "863")
assert(lines[872].startsWith(".prose-editor .seo-media-grid-cell--empty {"), "873")
assert(lines[1132].startsWith(".prose-content .seo-media-grid-cell p,"), "1133")
assert(lines[1156].startsWith(".prose-editor .seo-media-grid-cell ul,"), "1157")
assert(lines[1168].startsWith(".prose-editor .seo-media-grid-cell blockquote {"), "1169")
assert(lines[1178].startsWith(".prose-editor .seo-media-grid-cell p {"), "1179")
assert(lines[1213].startsWith('.prose-editor .seo-media-grid-cell[data-cell-kind="media"] .seo-media {'), "1214")
assert(lines[1235].startsWith("/* Gapcursor"), "1236")
assert(lines[1254].startsWith("/* Global shortcodes"), "1255")
assert(lines[1295].startsWith("/* Tourvisor search widget"), "1296")

// ---------- 1. flatpickr: базовый CSS + брендовые переопределения (порядок сохранён) ----------
const flatpickr = [
  "/* Календарь flatpickr (фильтр «Период выезда» в каталоге и таблице дат).",
  "   Файл подключается ТОЛЬКО из лениво загружаемого модуля календаря",
  "   (components/ui/date-range-picker-flatpickr.tsx), поэтому ни байта этих",
  "   стилей не попадает в критический CSS публичных страниц. Базовый CSS",
  "   flatpickr импортируется здесь же: ниже много переопределений .flatpickr-*",
  "   той же специфичности, и их порядок относительно базового CSS важен. */",
  "@import 'flatpickr/dist/flatpickr.css';",
  "",
  ...L(252, 409),
  "",
]
writeFileSync("/vercel/share/v0-project/styles/flatpickr-theme.css", flatpickr.join("\n"))

// ---------- 2. editor.css: стили ТОЛЬКО редактора TipTap (админка) ----------
const editorMixed1 = [
  ".prose-editor .seo-media > img,",
  ".prose-editor .seo-media > video,",
  ".prose-editor .seo-media > iframe {",
  ...L(692, 696), // тело правила после селектора .prose-content
]
const editorMixed2 = [
  "/* Grid cells: chooser / text / media cards (table-like) */",
  ".prose-editor .seo-media-grid p.is-empty::before,",
  ".prose-editor .seo-media-grid p:has(> br.ProseMirror-trailingBreak:only-child)::before {",
  "  content: none !important;",
  "}",
]
const editor = [
  "/* Стили редактора TipTap (.prose-editor) и полей шорткодов — только для админки.",
  "   Подключается из app/admin/layout.tsx. Общие правила вывода rich-текста,",
  "   одинаковые для редактора и сайта (.prose-content, .prose-editor), живут в",
  "   app/globals.css — там они нужны и посетителям. Сюда вынесено всё, что",
  "   описывает «хром» редактора: плейсхолдеры, карточки ячеек медиа-сетки, кнопки",
  "   перетаскивания/удаления, gap-cursor, токены шорткодов. Раньше эти ~700 строк",
  "   грузились на каждой публичной странице в составе render-blocking CSS. */",
  "",
  ...L(623, 687),
  ...editorMixed1,
  "",
  ...L(806, 846),
  ...editorMixed2,
  "",
  ...L(854, 862),
  ...L(873, 1132),
  ...L(1157, 1162),
  ...L(1169, 1173),
  ...L(1179, 1203),
  ...L(1214, 1235),
  ...L(1236, 1254),
  ...L(1255, 1295),
]
writeFileSync("/vercel/share/v0-project/app/admin/editor.css", editor.join("\n").replace(/\n{3,}/g, "\n\n"))

// ---------- 3. новый globals.css: только публично нужное ----------
const publicMixed1 = [
  ".prose-content .seo-media > iframe {",
  ...L(692, 696),
]
const publicMixed2 = [
  ".prose-content .seo-media-grid p.is-empty::before {",
  "  content: none !important;",
  "}",
]
const head = [
  ...L(1, 5),
  "/* flatpickr: базовый CSS и переопределения — в styles/flatpickr-theme.css,",
  "   он подключается лениво вместе с чанком календаря (date-range-picker). */",
  "/* Базовый CSS ProseMirror и стили «хрома» редактора (app/admin/editor.css)",
  "   импортируются в app/admin/layout.tsx — витрине стили редактора не нужны. */",
  "",
  // @theme inline без неиспользуемых sidebar/chart токенов (они нигде не применяются)
  ...L(14, 36),
  ...L(50, 75),
  "",
  // :root без chart/sidebar переменных; тёмная тема в проекте не используется
  // (html всегда с классом light, dark:-вариантов нет) — блоки .dark и
  // prefers-color-scheme удалены как мёртвый CSS.
  ...L(77, 96),
  "  --radius: 0.25rem;",
  "}",
  "",
  ...L(185, 251),
]
const richText = [
  ...L(411, 622),
  ...publicMixed1,
  ...L(697, 805),
  ...publicMixed2,
  "",
  ...L(863, 872),
  ...L(1133, 1156),
  ...L(1163, 1168),
  ...L(1174, 1178),
  ...L(1204, 1213),
  ...L(1296, lines.length),
]
const globals = [...head, ...richText].join("\n").replace(/\n{3,}/g, "\n\n")
writeFileSync(SRC, globals)

console.log("globals.css lines:", globals.split("\n").length)
console.log("editor.css lines:", editor.length)
console.log("flatpickr-theme.css lines:", flatpickr.length)
