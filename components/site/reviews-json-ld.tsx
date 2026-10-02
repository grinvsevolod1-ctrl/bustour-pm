/** TravelAgency Review / AggregateRating JSON-LD for /reviews (and similar). */

import type { Review } from "@/lib/types"
import {
  buildReviewsPageJsonLd,
  reviewDatePublished,
  serializeJsonLd,
  type ReviewSchemaItem,
} from "@/lib/reviews-json-ld"
import { organizationId } from "@/lib/site-schema"

export type { ReviewSchemaItem }

export function reviewsToSchemaItems(reviews: Review[]): ReviewSchemaItem[] {
  return reviews.map((r) => ({
    name: r.name,
    text: r.text,
    rating: r.rating,
    datePublished: reviewDatePublished(r),
  }))
}

export function ReviewsJsonLd({
  reviews,
  brandName,
  url,
}: {
  reviews: Review[]
  brandName: string
  url?: string
}) {
  let orgId: string | undefined
  if (url) {
    try {
      orgId = organizationId(new URL(url).origin)
    } catch {
      orgId = undefined
    }
  }
  const data = buildReviewsPageJsonLd(reviewsToSchemaItems(reviews), {
    brandName,
    url,
    ...(orgId ? { organizationId: orgId } : {}),
  })
  if (!data) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
