"use client"

import { useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Review } from "@/lib/types"
import { ReviewCardPublic, ReviewFullTextModal } from "@/components/site/review-card-public"
import { TitleUnderline } from "@/components/site/title-underline"
import { useReviewRowClamp } from "@/components/site/use-review-row-clamp"
import { cn } from "@/lib/utils"

// Десктоп: показываем отзывы страницами по 2 ряда × 2 колонки, чтобы они не
// «наваливались» во всю высоту страницы, а листались стрелками.
const PER_PAGE = 4

export function TourReviewsBlock({
  reviews,
  title = "Отзывы о туре",
}: {
  reviews: Review[]
  title?: string
}) {
  const [modalReview, setModalReview] = useState<Review | null>(null)
  const [page, setPage] = useState(0)
  const [deskPage, setDeskPage] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)
  const mobileReview = reviews[page]

  const deskPageCount = Math.max(1, Math.ceil(reviews.length / PER_PAGE))
  const deskSlice = useMemo(
    () => reviews.slice(deskPage * PER_PAGE, deskPage * PER_PAGE + PER_PAGE),
    [reviews, deskPage],
  )

  useReviewRowClamp(gridRef, [deskSlice.length, deskSlice.map((r) => r.id).join(",")])

  if (!reviews.length) return null

  return (
    <div className="space-y-4">
      {title.trim() ? <TitleUnderline as="h2">{title}</TitleUnderline> : null}

      {/* Mobile: CSS snap / page carousel */}
      <div className="md:hidden" aria-roledescription="carousel" aria-label={title}>
        {mobileReview ? (
          <ReviewCardPublic review={mobileReview} onReadMore={setModalReview} />
        ) : null}
        {reviews.length > 1 ? (
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Предыдущий отзыв"
              className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <span className="min-w-14 text-center text-sm text-ink-muted" aria-live="polite">
              {page + 1} / {reviews.length}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(reviews.length - 1, p + 1))}
              disabled={page === reviews.length - 1}
              aria-label="Следующий отзыв"
              className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      {/* Desktop: paginated 2×2 grid with prev/next controls */}
      <div className="hidden md:block">
        <div
          ref={gridRef}
          className={cn(
            "grid items-stretch gap-6",
            deskSlice.length > 1 ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {deskSlice.map((r) => (
            <ReviewCardPublic key={r.id} review={r} onReadMore={setModalReview} />
          ))}
        </div>
        {deskPageCount > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setDeskPage((p) => Math.max(0, p - 1))}
              disabled={deskPage === 0}
              aria-label="Предыдущие отзывы"
              className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <span className="min-w-14 text-center text-sm text-ink-muted" aria-live="polite">
              {deskPage + 1} / {deskPageCount}
            </span>
            <button
              type="button"
              onClick={() => setDeskPage((p) => Math.min(deskPageCount - 1, p + 1))}
              disabled={deskPage === deskPageCount - 1}
              aria-label="Следующие отзывы"
              className="grid h-11 w-11 place-items-center rounded-full border border-line text-ink transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      <ReviewFullTextModal
        review={modalReview}
        open={Boolean(modalReview)}
        onClose={() => setModalReview(null)}
      />
    </div>
  )
}
