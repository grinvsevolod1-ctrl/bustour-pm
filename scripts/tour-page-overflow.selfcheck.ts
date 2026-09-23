/**
 * Tour detail hero: no horizontal overflow @320 from info chips / gallery column.
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const page = readFileSync(join(process.cwd(), "components/site/tour-page-content.tsx"), "utf8")
const gallery = readFileSync(join(process.cwd(), "components/site/tour-gallery.tsx"), "utf8")

assert.match(page, /min-w-0 space-y-6/, "hero column min-w-0 in lg grid")
// Блок инфо-чипов «Длительность/Страна/Ночей» убран по просьбе владельца
// (коммит 0400803) — он не должен вернуться и снова дать оверфлоу @320.
assert.doesNotMatch(page, /flex min-w-0 items-center/, "info chips block must stay removed")
assert.match(gallery, /flex w-full min-w-0/, "gallery root min-w-0")

console.log("tour-page-overflow.selfcheck: ok")
