/**
 * TravelAgency/Product Review + AggregateRating JSON-LD (Google rich results emulator).
 *
 * Контракт после замечаний Rich Results Test (страница тура в Петербург):
 *  - вложенные отзывы НЕ несут itemReviewed (иначе внутри каждого отзыва
 *    появлялся «лишний» Product без offers/aggregateRating);
 *  - разметка отзывов живёт только в JSON-LD, HTML-карточка без microdata
 *    (дубль itemscope=Review без itemReviewed давал «5 объектов без itemReviewed»).
 * Run: npx tsx scripts/reviews-schema.selfcheck.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  buildReviewsPageJsonLd,
  normalizeReviewSchemaItems,
  reviewDatePublished,
  serializeJsonLd,
  withProductReviews,
} from "../lib/reviews-json-ld"
import { buildProductOfferJsonLd } from "../lib/site-schema"

const root = process.cwd()

function countTypes(node: unknown, type: string): number {
  if (Array.isArray(node)) return node.reduce((acc: number, n) => acc + countTypes(n, type), 0)
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>
    const self = obj["@type"] === type ? 1 : 0
    return Object.values(obj).reduce((acc: number, v) => acc + countTypes(v, type), self)
  }
  return 0
}

// ── Sample: 3 reviews + aggregate (Google Rich Results emulator) ─────────
const sample = buildReviewsPageJsonLd(
  [
    {
      name: "Анна Ковалёва",
      text: "Отличный тур в Питер, всё организовано.",
      rating: 5,
      datePublished: "2025-03-14",
    },
    {
      name: "Дмитрий Сидоров",
      text: "Хороший сервис компании.",
      rating: 4,
      datePublished: "2025-04-01",
    },
    {
      name: "Елена Морозова",
      text: "<b>Супер</b> поездка<script>alert(1)</script>",
      rating: 5,
      datePublished: "2025-05-20",
    },
  ],
  {
    brandName: "БасТур",
    url: "https://bastur.by/reviews",
    organizationId: "https://bastur.by/#organization",
  },
)

assert.ok(sample, "builds when valid reviews exist")
assert.equal(sample!["@type"], "TravelAgency")
assert.equal(sample!["@id"], "https://bastur.by/#organization")
assert.equal(sample!.review.length, 3)
assert.equal(sample!.aggregateRating.reviewCount, 3)
assert.equal(sample!.aggregateRating.ratingValue, 4.7)
assert.equal(typeof sample!.aggregateRating.ratingValue, "number")
assert.equal(typeof sample!.aggregateRating.reviewCount, "number")
assert.equal(typeof sample!.aggregateRating.bestRating, "number")

const r0 = sample!.review[0]
assert.equal(r0.author["@type"], "Person")
assert.equal(r0.author.name, "Анна Ковалёва")
assert.equal(r0.datePublished, "2025-03-14")
assert.match(r0.datePublished!, /^\d{4}-\d{2}-\d{2}$/)
assert.equal(typeof r0.reviewRating.ratingValue, "number")
assert.ok(!("itemReviewed" in r0), "nested review inherits itemReviewed from parent")
assert.equal(countTypes(sample, "Product"), 0, "no stray Product nodes inside TravelAgency reviews")
assert.equal(countTypes(sample, "TravelAgency"), 1, "exactly one TravelAgency node")

const r2 = sample!.review[2]
assert.equal(r2.reviewBody, "Супер поездка")
assert.ok(!/</.test(r2.reviewBody), "body has no HTML")
assert.ok(!/script/i.test(r2.reviewBody), "no script residue")

// HTML strip / invalid skip (legacy cases)
const page = buildReviewsPageJsonLd(
  [
    { name: "Анна <b>К</b>", text: "<p>Отличный тур.</p>", rating: 5, datePublished: "2025-03-14" },
    { name: "  ", text: "пусто", rating: 5 },
    { name: "Дима", text: "Норм", rating: 4 },
    { name: "Bad", text: "skip", rating: 0 },
  ],
  { brandName: "БасТур", url: "https://bastur.by/reviews" },
)
assert.equal(page!.review.length, 2)
assert.equal(page!.aggregateRating.ratingValue, 4.5)
assert.equal(page!.review[0].author.name, "Анна К")

assert.equal(buildReviewsPageJsonLd([], { brandName: "X" }), null)

assert.equal(reviewDatePublished({ sourceDate: "2024-01-02T12:00:00Z" }), "2024-01-02")
assert.equal(reviewDatePublished({ createdAt: Date.UTC(2023, 0, 5) }), "2023-01-05")
assert.equal(reviewDatePublished({ sourceDate: "вчера" }), undefined)

assert.deepEqual(
  normalizeReviewSchemaItems([{ name: " A ", text: " B ", rating: 5.4 }]),
  [{ name: "A", text: "B", rating: 5 }],
)

const serialized = serializeJsonLd(sample)
assert.doesNotMatch(serialized, /itemReviewed/, "serialized JSON-LD has no itemReviewed")
const revived = JSON.parse(serialized) as NonNullable<typeof sample>
assert.equal(typeof revived.aggregateRating.ratingValue, "number")
assert.equal(typeof revived.review[0].reviewRating.ratingValue, "number")
assert.equal(revived.review[0].author["@type"], "Person")

// Product + reviews (tour page): ровно один Product, отзывы вложены без копий товара
const product = buildProductOfferJsonLd({
  name: "Тур в Питер",
  price: 199,
  priceCurrency: "BYN",
  url: "https://bastur.by/avtobusnye-tury/by/minsk/piter/",
})
assert.ok(product)
const withReviews = withProductReviews(product!, [
  { name: "Аня", text: "Класс", rating: 5, datePublished: "2025-01-01" },
  { name: "Олег", text: "Ок", rating: 4, datePublished: "2025-02-01" },
])
assert.ok("aggregateRating" in withReviews)
assert.equal((withReviews as { aggregateRating: { reviewCount: number } }).aggregateRating.reviewCount, 2)
assert.equal(countTypes(withReviews, "Product"), 1, "tour page emits exactly one Product node")
assert.equal(countTypes(withReviews, "Review"), 2)
assert.doesNotMatch(serializeJsonLd(withReviews), /itemReviewed/)

// Отзывы без валидных элементов не трогают Product
assert.equal(withProductReviews(product!, [{ name: "", text: "", rating: 0 }]), product)

// ── Wiring ─────────────────────────────────────────────────────────────
assert.match(readFileSync(join(root, "components/site/reviews-json-ld.tsx"), "utf8"), /buildReviewsPageJsonLd/)
assert.match(readFileSync(join(root, "app/(site)/reviews/page.tsx"), "utf8"), /ReviewsJsonLd/)
assert.match(readFileSync(join(root, "components/site/tour-page-content.tsx"), "utf8"), /withProductReviews/)

// Единственный источник разметки отзывов — JSON-LD; в HTML-карточке microdata быть не должно.
const card = readFileSync(join(root, "components/site/review-card-public.tsx"), "utf8")
assert.doesNotMatch(card, /itemScope|itemProp|itemType/, "review card must not duplicate schema via microdata")
assert.match(card, /<time dateTime=\{iso\}/, "review date stays machine-readable via <time>")

console.log(JSON.stringify(sample, null, 2))
console.log("reviews-schema.selfcheck: ok")
console.log(
  "Разметка отзывов: только JSON-LD, вложенные Review без itemReviewed, один Product на странице тура. Эмулятор Rich Results: ошибок 0.",
)
