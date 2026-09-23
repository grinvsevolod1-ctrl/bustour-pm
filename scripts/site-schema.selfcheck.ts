/**
 * Shared site schema.org builders + public wiring.
 * Run: npx tsx scripts/site-schema.selfcheck.ts
 */
// ВАЖНО: env-прелюдия должна идти первым импортом — lib/canonical-origin
// фиксирует origin из env в момент своего импорта.
import "./_selfcheck-site-env"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  absoluteUrl,
  buildArticleJsonLd,
  buildOpeningHours,
  buildProductOfferJsonLd,
  buildTravelAgencyJsonLd,
  buildWebSiteJsonLd,
  organizationId,
  parseHoursFull,
  serializeJsonLd,
} from "../lib/site-schema"
import type { SiteSettings } from "../lib/types"

const root = process.cwd()

const settings: SiteSettings = {
  "site.brand": "БасТур <b>x</b>",
  "site.url": "https://bastur.by",
  "site.address": "ул. Примерная 1",
  "social.links": JSON.stringify([
    { id: "ig", label: "IG", url: "https://instagram.com/bastur", enabled: true },
    { id: "bad", label: "X", url: "not-a-url", enabled: true },
  ]),
}

// ── Helpers ────────────────────────────────────────────────────────────
assert.equal(organizationId("https://bastur.by"), "https://bastur.by/#organization")
assert.equal(organizationId("https://bastur.by/"), "https://bastur.by/#organization")
assert.equal(absoluteUrl("https://bastur.by", "/helpful/a"), "https://bastur.by/helpful/a")
assert.equal(absoluteUrl("https://bastur.by/", "https://cdn/x.jpg"), "https://cdn/x.jpg")
assert.equal(absoluteUrl("https://bastur.by", ""), undefined)

// ── TravelAgency ───────────────────────────────────────────────────────
const org = buildTravelAgencyJsonLd(settings, {
  phone: "+375291112233",
  email: "info@bastur.by",
})
assert.equal(org["@type"], "TravelAgency")
assert.equal(org["@id"], "https://bastur.by/#organization")
assert.equal(org.url, "https://bastur.by")
assert.equal(org.name, "БасТур x")
assert.equal(org.telephone, "+375291112233")
assert.equal(org.email, "info@bastur.by")
assert.equal(org.logo, "https://bastur.by/figma/logomark.svg")
assert.deepEqual(org.sameAs, ["https://instagram.com/bastur"])
assert.equal(org.address?.streetAddress, "ул. Примерная 1")
assert.equal(org.address?.addressCountry, "BY")
assert.ok(org.openingHoursSpecification?.length)
assert.equal(org.openingHoursSpecification[0]["@type"], "OpeningHoursSpecification")
assert.deepEqual(org.openingHoursSpecification[0].dayOfWeek, [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
])
assert.equal(org.openingHoursSpecification[0].opens, "10:00")
assert.equal(org.openingHoursSpecification[0].closes, "18:00")
assert.equal("openingHours" in org, false)

const orgJson = serializeJsonLd(org)
assert.ok(!orgJson.includes("<") || orgJson.includes("\\u003c"), "safe serialize")
assert.match(orgJson, /bastur\.by\/#organization/)
assert.match(orgJson, /OpeningHoursSpecification/)

// ── Часы работы: полный режим (site.hoursFull) с субботой ────────────────
const hoursFull = parseHoursFull("пн–пт: 10:00–18:00\nсб: 9:00–15:00\nвс — выходной")
assert.equal(hoursFull.length, 2, "два рабочих блока (вс пропущен как выходной)")
assert.deepEqual(hoursFull[0].dayOfWeek, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
assert.equal(hoursFull[0].opens, "10:00")
assert.equal(hoursFull[0].closes, "18:00")
assert.deepEqual(hoursFull[1].dayOfWeek, ["Saturday"])
assert.equal(hoursFull[1].opens, "09:00", "время дополняется ведущим нулём")
assert.equal(hoursFull[1].closes, "15:00")

// «ежедневно» → все 7 дней
const daily = parseHoursFull("ежедневно 9:00–21:00")
assert.equal(daily.length, 1)
assert.equal(daily[0].dayOfWeek.length, 7)

// Список дней через запятую
const listDays = parseHoursFull("пн, ср, пт: 11:00–19:00")
assert.deepEqual(listDays[0].dayOfWeek, ["Monday", "Wednesday", "Friday"])

// Строки без времени игнорируются целиком
assert.equal(parseHoursFull("сб и вс — выходной").length, 0)
assert.equal(parseHoursFull("").length, 0)

// buildOpeningHours: без site.hours полный режим используется как есть
const ohFull = buildOpeningHours({ "site.hoursFull": "пн–сб: 10:00–20:00" })
assert.deepEqual(ohFull[0].dayOfWeek, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"])
// Только site.hours (нет полного режима) → Пн–Пт из шапки
const ohFallback = buildOpeningHours({ "site.hours": "9:00–17:00" })
assert.deepEqual(ohFallback[0].dayOfWeek, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
assert.equal(ohFallback[0].opens, "09:00")
assert.equal(ohFallback[0].closes, "17:00")

// Расхождение шапки и полного режима: будни ← site.hours (как в шапке),
// суббота ← полный режим. Будние часы hoursFull НЕ перекрывают site.hours.
const ohMerged = buildOpeningHours({
  "site.hours": "10:00–18:00",
  "site.hoursFull": "пн–пт: 9:00–21:00\nсб: 10:00–15:00",
})
assert.equal(ohMerged.length, 2, "будни (одним блоком) + суббота")
assert.deepEqual(ohMerged[0].dayOfWeek, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
assert.equal(ohMerged[0].opens, "10:00", "будни берутся из site.hours (шапка), не из hoursFull")
assert.equal(ohMerged[0].closes, "18:00")
assert.deepEqual(ohMerged[1].dayOfWeek, ["Saturday"])
assert.equal(ohMerged[1].opens, "10:00")
assert.equal(ohMerged[1].closes, "15:00")

// TravelAgency отражает субботу, когда задан полный режим
const orgWithSat = buildTravelAgencyJsonLd({ ...settings, "site.hoursFull": "пн–пт: 10:00–18:00\nсб: 10:00–15:00" })
assert.equal(orgWithSat.openingHoursSpecification.length, 2)
assert.deepEqual(orgWithSat.openingHoursSpecification[1].dayOfWeek, ["Saturday"])

// ── WebSite (no SearchAction — Tourvisor is not a first-party search URL) ─
const site = buildWebSiteJsonLd(settings)
assert.equal(site["@type"], "WebSite")
assert.equal(site.url, "https://bastur.by")
assert.equal(site.publisher["@id"], "https://bastur.by/#organization")
assert.equal(site.name, "БасТур x")
assert.equal("potentialAction" in site, false)

// ── Article ────────────────────────────────────────────────────────────
const article = buildArticleJsonLd({
  origin: "https://bastur.by",
  brandName: "БасТур",
  title: "Новость <em>1</em>",
  description: "<p>Текст</p>",
  image: "/uploads/a.jpg",
  date: "2026-07-01",
  urlPath: "/helpful/novosti/news-1",
})
assert.ok(article)
assert.equal(article!["@type"], "Article")
assert.equal(article!.headline, "Новость 1")
assert.equal(article!.description, "Текст")
assert.equal(article!.url, "https://bastur.by/helpful/novosti/news-1")
assert.equal(article!.datePublished, "2026-07-01")
assert.equal(article!.publisher["@id"], "https://bastur.by/#organization")
assert.equal(buildArticleJsonLd({ origin: "https://x.by", brandName: "X", title: "  ", urlPath: "/a" }), null)

// ── Product ────────────────────────────────────────────────────────────
const product = buildProductOfferJsonLd({
  name: "Тур <b>A</b>",
  description: "<p>Описание</p>",
  image: "https://bastur.by/t.jpg",
  url: "https://bastur.by/t/",
  category: "Автобусные туры",
  brandName: "БасТур",
  price: "199.50 BYN",
  priceCurrency: "BYN",
})
assert.ok(product)
assert.equal(product!["@type"], "Product")
assert.equal(product!.name, "Тур A")
assert.equal(product!.offers.price, "199.5")
assert.equal(product!.offers.priceCurrency, "BYN")
assert.equal(product!.brand?.name, "БасТур")
// priceValidUntil: по умолчанию конец следующего года (YYYY-12-31), формат ISO-даты.
assert.match(product!.offers.priceValidUntil ?? "", /^\d{4}-12-31$/)
assert.ok(
  Number((product!.offers.priceValidUntil ?? "0").slice(0, 4)) > new Date().getUTCFullYear(),
  "priceValidUntil должен быть в будущем",
)
// Явно переданный priceValidUntil должен использоваться как есть.
const productFixedDate = buildProductOfferJsonLd({
  name: "Тур B",
  price: 500,
  priceValidUntil: "2030-01-15",
})
assert.equal(productFixedDate!.offers.priceValidUntil, "2030-01-15")

// ── Wiring ─────────────────────────────────────────────────────────────
const layout = readFileSync(join(root, "app/(site)/layout.tsx"), "utf8")
assert.match(layout, /buildTravelAgencyJsonLd/)
assert.match(layout, /serializeJsonLd/)

const home = readFileSync(join(root, "app/(site)/page.tsx"), "utf8")
assert.match(home, /buildWebSiteJsonLd/)
assert.match(home, /application\/ld\+json/)

const articlePage = readFileSync(join(root, "app/(site)/helpful/article-page.tsx"), "utf8")
assert.match(articlePage, /buildArticleJsonLd/)
assert.match(articlePage, /articleUrl/)

const busPage = readFileSync(join(root, "app/(site)/arenda-avtobusov-v-minske/[slug]/page.tsx"), "utf8")
assert.match(busPage, /metadataFromSettings|Breadcrumb/)
assert.doesNotMatch(busPage, /NEXT_PUBLIC_SITE_URL/)
assert.doesNotMatch(busPage, /buildProductOfferJsonLd/, "bus rental has no price — no Product Offer")
assert.doesNotMatch(busPage, /application\/ld\+json/)

const tourPage = readFileSync(join(root, "components/site/tour-page-content.tsx"), "utf8")
assert.match(tourPage, /buildProductOfferJsonLd/)
assert.match(tourPage, /serializeJsonLd/)

const reviewsLd = readFileSync(join(root, "components/site/reviews-json-ld.tsx"), "utf8")
assert.match(reviewsLd, /organizationId/)

const crumb = readFileSync(join(root, "components/site/breadcrumb.tsx"), "utf8")
assert.match(crumb, /serializeJsonLd/)
// URL крошек в JSON-LD — через canonical-origin (env), не через CMS site.url:
// единый trust boundary с canonical/sitemap и единый формат без слеша.
assert.match(crumb, /canonicalAbsoluteUrl/)
assert.doesNotMatch(crumb, /getSiteOrigin/)

console.log("ok")
