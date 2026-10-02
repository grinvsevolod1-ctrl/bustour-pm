/** Pure TravelAgency/Product + Review / AggregateRating JSON-LD (Google rich results). */

import { serializeJsonLd } from "@/lib/faq-schema"
import { reviewPlainText } from "@/lib/review-utils"

export { serializeJsonLd }

export type ReviewSchemaItem = {
  name: string
  text: string
  rating: number
  /** ISO date YYYY-MM-DD when known */
  datePublished?: string
}

/**
 * Вложенный отзыв (свойство `review` у Product/TravelAgency). itemReviewed здесь
 * намеренно отсутствует: вложенный отзыв наследует объект от родителя, а
 * отдельный Product с одним только name внутри отзыва Rich Results Test считал
 * самостоятельным товаром без offers/aggregateRating и помечал ошибкой.
 */
export type ReviewJsonLdNode = {
  "@type": "Review"
  author: { "@type": "Person"; name: string }
  reviewBody: string
  reviewRating: {
    "@type": "Rating"
    ratingValue: number
    bestRating: number
    worstRating: number
  }
  datePublished?: string
}

export type AggregateRatingJsonLd = {
  "@type": "AggregateRating"
  ratingValue: number
  reviewCount: number
  bestRating: number
  worstRating: number
}

export type ReviewsPageJsonLd = {
  "@context": "https://schema.org"
  "@type": "TravelAgency"
  "@id"?: string
  name: string
  url?: string
  aggregateRating: AggregateRatingJsonLd
  review: ReviewJsonLdNode[]
}

export type BuildReviewsJsonLdOptions = {
  brandName: string
  url?: string
  organizationId?: string
}

/** Prefer sourceDate (ISO prefix), else createdAt epoch ms → YYYY-MM-DD. */
export function reviewDatePublished(input: {
  sourceDate?: string | null
  createdAt?: number | null
}): string | undefined {
  const raw = input.sourceDate?.trim()
  if (raw && /^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  if (input.createdAt && Number.isFinite(input.createdAt)) {
    return new Date(input.createdAt).toISOString().slice(0, 10)
  }
  return undefined
}

function clampRating(rating: number): number | null {
  if (!Number.isFinite(rating)) return null
  const n = Math.round(rating)
  if (n < 1 || n > 5) return null
  return n
}

export function normalizeReviewSchemaItems(items: ReviewSchemaItem[]): ReviewSchemaItem[] {
  return items
    .map((item) => {
      const rating = clampRating(item.rating)
      if (rating == null) return null
      const name = reviewPlainText(item.name)
      const text = reviewPlainText(item.text)
      if (!name || !text) return null
      return {
        name,
        text,
        rating,
        ...(item.datePublished ? { datePublished: item.datePublished } : {}),
      }
    })
    .filter((item): item is ReviewSchemaItem => item != null)
}

export function buildAggregateRating(reviews: ReviewSchemaItem[]): AggregateRatingJsonLd {
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  const avg = Math.round((sum / reviews.length) * 10) / 10
  return {
    "@type": "AggregateRating",
    ratingValue: avg,
    reviewCount: reviews.length,
    bestRating: 5,
    worstRating: 1,
  }
}

function buildReviewNodes(reviews: ReviewSchemaItem[]): ReviewJsonLdNode[] {
  return reviews.map((r) => ({
    "@type": "Review" as const,
    author: { "@type": "Person" as const, name: r.name },
    reviewBody: r.text,
    reviewRating: {
      "@type": "Rating" as const,
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    ...(r.datePublished ? { datePublished: r.datePublished } : {}),
  }))
}

/** TravelAgency JSON-LD with AggregateRating + Review[]. Null when no valid reviews. */
export function buildReviewsPageJsonLd(
  items: ReviewSchemaItem[],
  options: BuildReviewsJsonLdOptions,
): ReviewsPageJsonLd | null {
  const reviews = normalizeReviewSchemaItems(items)
  if (!reviews.length) return null

  const brandName = reviewPlainText(options.brandName) || "БасТур"

  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    ...(options.organizationId ? { "@id": options.organizationId } : {}),
    name: brandName,
    ...(options.url ? { url: options.url } : {}),
    aggregateRating: buildAggregateRating(reviews),
    review: buildReviewNodes(reviews),
  }
}

/** Attach AggregateRating + Review[] onto an existing Product JSON-LD (tour page). */
export function withProductReviews<T extends { "@type": "Product"; name: string }>(
  product: T,
  items: ReviewSchemaItem[],
): (T & { aggregateRating: AggregateRatingJsonLd; review: ReviewJsonLdNode[] }) | T {
  const reviews = normalizeReviewSchemaItems(items)
  if (!reviews.length) return product
  return {
    ...product,
    aggregateRating: buildAggregateRating(reviews),
    review: buildReviewNodes(reviews),
  }
}
