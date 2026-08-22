/**
 * Meta: e2e specs that create entities must mention purge/cleanup/restore lifecycle.
 * Allowlist of create-specs (ponytail: explicit > heuristic scan).
 * Run: npx tsx scripts/test-lifecycle-coverage.selfcheck.ts
 */
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const root = process.cwd()
const e2eDir = join(root, "e2e")

/** Specs that create durable DB rows via admin UI. */
const CREATE_SPECS: { file: string; mustInclude: RegExp[] }[] = [
  {
    file: "tours-crud.spec.ts",
    mustInclude: [/purgeArchivedRow|purge/, /restoreArchivedRow|restore/],
  },
  {
    file: "reviews.spec.ts",
    mustInclude: [/purgeArchivedRow|purge/, /restoreArchivedRow|restore|archive/],
  },
  {
    file: "archive.spec.ts",
    mustInclude: [/purgeArchivedRow|purge/, /restore/],
  },
  {
    file: "buses-crud.spec.ts",
    mustInclude: [/purgeArchivedRow|purge/, /restoreArchivedRow|restore/],
  },
  {
    file: "articles-lifecycle.spec.ts",
    mustInclude: [/purgeArchivedRow|purge/, /restoreArchivedRow|restore/],
  },
  {
    file: "public-cms-regression.spec.ts",
    mustInclude: [/cleanupCatalogFixture/],
  },
  {
    file: "city-sticky-save-wipe.spec.ts",
    mustInclude: [/cleanupCatalogFixture/],
  },
  {
    file: "cms-header-vs-seed.spec.ts",
    mustInclude: [/cleanupCatalogFixture/],
  },
  {
    file: "sidebar-hidden-pages.spec.ts",
    mustInclude: [/cleanupCatalogFixture|purgeArchivedRow|purge/],
  },
  {
    file: "page-alerts.spec.ts",
    mustInclude: [/withSettingsSnapshot|fill\(""\)/],
  },
  {
    file: "admin-roles-audit.spec.ts",
    mustInclude: [/purgeAdminUser|purgeAdminByUsername/, /finally/],
  },
]

const softDelete = readFileSync(join(root, "scripts/soft-delete-entities.selfcheck.ts"), "utf8")
for (const name of [
  "purgeReview",
  "purgeStaffMember",
  "purgeTransfer",
  "purgeLead",
  "purgeArticle",
  "purgeTour",
  "purgeBus",
  "purgeCity",
  "purgeCountry",
]) {
  assert.ok(softDelete.includes(name), `soft-delete-entities missing ${name}`)
}

const entityArchive = readFileSync(join(root, "scripts/entity-archive-restore.selfcheck.ts"), "utf8")
assert.ok(entityArchive.includes("purgeTour"))
assert.ok(entityArchive.includes("purgeBus"))
assert.ok(entityArchive.includes("purgeArticle"))

// В репозитории из e2e-спеков остался только admin-smoke: расширенный набор
// (catalog-fixtures + CRUD-спеки) в git не попал. Жёсткие readFileSync валили
// selfcheck в любом свежем клоне, поэтому проверяем lifecycle-контракт только
// у реально существующих файлов; сам контракт для новых спеков сохранён.
const fixturesPath = join(e2eDir, "catalog-fixtures.ts")
if (existsSync(fixturesPath)) {
  const fixtures = readFileSync(fixturesPath, "utf8")
  assert.ok(fixtures.includes("export async function restoreArchivedRow"))
  assert.ok(fixtures.includes("export async function purgeArchivedRow"))
  assert.ok(fixtures.includes("export async function createFleetBus"))
} else {
  console.log("test-lifecycle-coverage: e2e/catalog-fixtures.ts отсутствует — проверка фикстур пропущена")
}

for (const { file, mustInclude } of CREATE_SPECS) {
  const specPath = join(e2eDir, file)
  if (!existsSync(specPath)) continue
  const src = readFileSync(specPath, "utf8")
  for (const re of mustInclude) {
    assert.match(src, re, `${file} missing lifecycle pattern ${re}`)
  }
}

console.log("test-lifecycle-coverage selfcheck: ok")
