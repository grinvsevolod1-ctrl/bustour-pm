import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { tourUrl } from "@/lib/tour-url"

// Без завершающего слэша: trailingSlash=false, иначе каждый серверный
// редирект на тур получал второй прыжок 308 от самого Next.
assert.equal(
  tourUrl({ tourSlug: "piter", countrySlug: "rossiya", citySlug: "sankt-peterburg" }),
  "/avtobusnye-tury/rossiya/sankt-peterburg/piter",
)

assert.equal(tourUrl({ tourSlug: "x", countrySlug: "", citySlug: "city" }), null)
assert.equal(tourUrl({ tourSlug: "x", countrySlug: "country", citySlug: "" }), null)
assert.equal(tourUrl({ tourSlug: "", countrySlug: "country", citySlug: "city" }), null)
assert.equal(tourUrl({ tourSlug: "x", countrySlug: null, citySlug: "city" }), null)
assert.equal(tourUrl({ tourSlug: "x", countrySlug: "country", citySlug: undefined }), null)

const ok = tourUrl({ tourSlug: "a", countrySlug: "b", citySlug: "c" })
assert.ok(ok && !ok.includes("unknown"))

// #72: bus tour page must redirect mismatched country/city to tourUrl canonical
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const tourPage = fs.readFileSync(
  path.join(root, "app/(site)/avtobusnye-tury/[countrySlug]/[citySlug]/[tourSlug]/page.tsx"),
  "utf8",
)
assert.ok(tourPage.includes("permanentRedirect"), "#72 permanentRedirect on mismatch")
assert.ok(tourPage.includes("tourUrl("), "#72 uses tourUrl for canonical")
assert.ok(
  tourPage.includes("countrySlug !== tour.countrySlug") &&
    tourPage.includes("citySlug !== tour.citySlug"),
  "#72 compares path segments to tour slugs",
)

// Legacy /tour/:slug — постоянный редирект (308), а не временный 307.
const legacyTourPage = fs.readFileSync(path.join(root, "app/(site)/tour/[slug]/page.tsx"), "utf8")
assert.ok(legacyTourPage.includes("permanentRedirect(url)"), "legacy /tour/:slug uses permanentRedirect")

// Цели redirects() в next.config без завершающего слэша — иначе Next добавляет
// второй прыжок 308 (/avtobusnye-tury/ → /avtobusnye-tury) на каждый старый URL.
const nextConfig = fs.readFileSync(path.join(root, "next.config.mjs"), "utf8")
const slashDestinations = [...nextConfig.matchAll(/destination:\s*"([^"]+)"/g)]
  .map((m) => m[1])
  .filter((d) => d.length > 1 && d.endsWith("/"))
assert.deepEqual(slashDestinations, [], `redirect destinations with trailing slash: ${slashDestinations.join(", ")}`)

console.log("tour-url.selfcheck: ok")
