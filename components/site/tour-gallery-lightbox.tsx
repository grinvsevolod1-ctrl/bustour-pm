"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { ZoomableLightboxImage } from "@/components/site/image-lightbox"
import { SlideMedia, isVideoUrl, mediaLabel, type GallerySlide } from "./tour-gallery-media"

/**
 * Полноэкранный просмотр галереи тура. Вынесен из tour-gallery.tsx в отдельный
 * модуль и грузится через next/dynamic только по клику на «развернуть»: вместе
 * с ним уходит из первоначального бандла страницы тура и логика зума
 * (image-lightbox.tsx), которая до клика не нужна.
 */
export function TourGalleryLightbox({
  slides,
  index,
  onClose,
  onNav,
}: {
  slides: GallerySlide[]
  index: number
  onClose: () => void
  onNav: (i: number) => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") onNav((index - 1 + slides.length) % slides.length)
      if (e.key === "ArrowRight") onNav((index + 1) % slides.length)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [index, slides.length, onClose, onNav])

  const slide = slides[index]
  const caption =
    slide?.alt && slides.length > 1 ? `${slide.alt} — ${mediaLabel(slide)} ${index + 1}` : slide?.alt || ""

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overscroll-none bg-black/90 backdrop-blur-sm ${
        zoomed ? "p-0" : "overflow-hidden p-3 sm:p-4"
      }`}
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
        paddingRight: "max(0.75rem, env(safe-area-inset-right))",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={caption || `Просмотр ${mediaLabel(slide)}`}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        className="fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white touch-manipulation transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:right-4"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onNav((index - 1 + slides.length) % slides.length)
        }}
        aria-label="Предыдущее"
        className="fixed left-1 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white touch-manipulation transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:left-4 sm:h-12 sm:w-12"
      >
        <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
      </button>

      <div
        className={
          zoomed
            ? "relative h-full w-full max-w-none max-h-none p-0"
            : "relative mx-12 h-[min(85dvh,calc(100dvh-1.5rem))] w-full max-w-full sm:mx-16 md:max-w-[80vw]"
        }
        onClick={(e) => e.stopPropagation()}
      >
        {slide && isVideoUrl(slide.url) ? (
          <SlideMedia
            slide={{ ...slide, alt: caption }}
            sizes="100vw"
            controls
            priority
          />
        ) : slide ? (
          <ZoomableLightboxImage src={slide.url} alt={caption} onZoomChange={setZoomed} />
        ) : null}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onNav((index + 1) % slides.length)
        }}
        aria-label="Следующее"
        className="fixed right-1 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white touch-manipulation transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:right-4 sm:h-12 sm:w-12"
      >
        <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
      </button>

      <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 text-sm text-white/60">
        {index + 1} / {slides.length}
      </div>
    </div>,
    document.body,
  )
}
