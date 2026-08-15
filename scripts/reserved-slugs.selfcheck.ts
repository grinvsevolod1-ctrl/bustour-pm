import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import { join } from "node:path"
import { resolveAviaSlug, DEFAULT_AVIA_SLUG, AVIA_INTERNAL_PREFIX } from "../lib/avia-slug"

// Сверяем RESERVED_SLUGS с реальной файловой системой, чтобы список
// не устаревал: новый корневой раздел или каталог в public/ без записи
// в RESERVED_SLUGS может быть «захвачен» админским aviatory.slug,
// и middleware начнёт переписывать чужие пути.

const root = join(__dirname, "..")

/** Корневые разделы публичного сайта app/(site)/* (только директории). */
const siteSections = readdirSync(join(root, "app", "(site)"), { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)

/** Каталоги public/* — middleware их matcher не исключает. */
const publicDirs = readdirSync(join(root, "public"), { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)

for (const section of siteSections) {
  // Внутренняя папка авиатуров — единственная, которую слаг МОЖЕТ «занимать»
  // (точнее, она сама зарезервирована как AVIA_INTERNAL_PREFIX).
  if (section === AVIA_INTERNAL_PREFIX) continue
  assert.equal(
    resolveAviaSlug(section),
    DEFAULT_AVIA_SLUG,
    `Раздел app/(site)/${section} не защищён в RESERVED_SLUGS: слаг "${section}" перепишет его пути`,
  )
}

for (const dir of publicDirs) {
  assert.equal(
    resolveAviaSlug(dir),
    DEFAULT_AVIA_SLUG,
    `Каталог public/${dir} не защищён в RESERVED_SLUGS: слаг "${dir}" сломает статику`,
  )
}

// Служебные пути, которых нет в файловой системе, но которые обязаны быть защищены.
for (const reserved of ["admin", "api", "uploads", "_next", "sitemap.xml", "robots.txt", AVIA_INTERNAL_PREFIX]) {
  assert.equal(resolveAviaSlug(reserved), DEFAULT_AVIA_SLUG, `Служебный путь "${reserved}" должен быть зарезервирован`)
}

console.log(`reserved-slugs.selfcheck ok (${siteSections.length} разделов, ${publicDirs.length} public-каталогов)`)
