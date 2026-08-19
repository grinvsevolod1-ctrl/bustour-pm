/**
 * Selfcheck: P0 indexes exist + hot query plans use them (no bare Seq Scan on indexed filters).
 * Postgres version — the project migrated off SQLite/libsql (see AGENTS.md).
 * Run: npx tsx scripts/db-indexes-listings.selfcheck.ts
 */
import assert from "node:assert/strict"
import { readQueriesSource } from "./lib/read-queries-source"

const REQUIRED = [
  "tours_archived_category_idx",
  "tours_archived_featured_idx",
  "tours_country_id_idx",
  "tours_arrival_city_id_idx",
  "content_blocks_collection_page_idx",
  "tour_dates_tour_id_idx",
  "tour_date_tags_date_id_idx",
  "tour_date_rooms_date_id_idx",
  "transfer_schedules_transfer_id_idx",
  "certificates_section_id_idx",
  "leads_archived_idx",
  "reviews_archived_approved_idx",
  "city_destinations_category_archived_idx",
]

async function main() {
  // Apply migrations via app ensureDb
  const { ensureDb } = await import("../lib/db/init")
  await ensureDb()
  const { client, closeDbPool } = await import("../lib/db")

  try {
    const idx = await client.execute(
      "SELECT indexname FROM pg_indexes WHERE schemaname = 'public'",
    )
    const names = new Set(idx.rows.map((r) => String(r.indexname)))
    for (const name of REQUIRED) {
      assert.ok(names.has(name), `missing index ${name}`)
    }

    async function planDetail(sql: string): Promise<string> {
      const r = await client.execute(`EXPLAIN ${sql}`)
      return r.rows.map((row) => Object.values(row).join(" ")).join(" | ")
    }

    const catPlan = await planDetail(
      "SELECT id FROM tours WHERE archived = false AND category = 'bus'",
    )
    assert.match(
      catPlan,
      /tours_archived_category_idx|Index Scan|Bitmap/i,
      `category filter should use composite index, got: ${catPlan}`,
    )
    assert.doesNotMatch(catPlan, /Seq Scan on tours\b/i, `unexpected full Seq Scan tours: ${catPlan}`)

    const featPlan = await planDetail(
      "SELECT id FROM tours WHERE archived = false AND featured = true",
    )
    assert.match(
      featPlan,
      /tours_archived_featured_idx|Index Scan|Bitmap/i,
      `featured filter should use composite index, got: ${featPlan}`,
    )

    const blocksPlan = await planDetail(
      "SELECT id FROM content_blocks WHERE collection = 'faq' AND page = 'hot'",
    )
    assert.match(
      blocksPlan,
      /content_blocks_collection_page_idx|Index Scan|Bitmap/i,
      `content_blocks should use collection+page index, got: ${blocksPlan}`,
    )

    const datesPlan = await planDetail('SELECT id FROM tour_dates WHERE "tourId" = 1')
    assert.match(
      datesPlan,
      /tour_dates_tour_id_idx|Index Scan|Bitmap/i,
      `tour_dates should use tourId index, got: ${datesPlan}`,
    )

    // Listing helpers must not full-load then filter in JS for home/bus
    const queriesSrc = readQueriesSource(process.cwd())
    assert.match(queriesSrc, /async function listTours/, "listTours helper present")
    assert.match(queriesSrc, /excludeHidden/, "SQL path supports hidden exclusion")
    assert.doesNotMatch(
      queriesSrc.slice(queriesSrc.indexOf("getHomeTourOffers"), queriesSrc.indexOf("getBusToursWithDates") + 200),
      /const all = await getTours\(\)/,
      "getHomeTourOffers must not load all tours then filter in JS",
    )

    console.log(
      JSON.stringify({
        ok: true,
        indexes: REQUIRED.length,
        plans: { catPlan, featPlan, blocksPlan, datesPlan },
      }),
    )
  } finally {
    await closeDbPool()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
