"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Play, Expand } from "lucide-react"
import { SlideMedia, isVideoUrl, mediaLabel, type GallerySlide } from "./tour-gallery-media"

type Direction = "left" | "right" | "none"

const loadLightbox = () => import("./tour-gallery-lightbox")

/**
 * Лайтбокс (портал + зум из image-lightbox.tsx) нужен только после клика по
 * «развернуть» — грузим его отдельным чанком, прогревая по намерению
 * (hover/focus/touch по кнопке). До клика страница тура его не исполняет.
 */
const TourGalleryLightbox = dynamic(() => loadLightbox().then((m) => m.TourGalleryLightbox), { ssr: false })

function useSlider(total: number) {
  const [active, setActive] = useState(0)
  const [outgoing, setOutgoing] = useState<number | null>(null)
  const [direction, setDirection] = useState<Direction>("none")

  const go = useCallback(
    (next: number, dir?: Direction) => {
      if (outgoing !== null || total <= 1) return
      const idx = ((next % total) + total) % total
      if (idx === active) return
      const inferred: Direction =
        (active + 1) % total === idx
          ? "left"
          : (active - 1 + total) % total === idx
            ? "right"
            : idx > active
              ? "left"
              : "right"
      setDirection(dir ?? inferred)
      setOutgoing(active)
      setActive(idx)
    },
    [active, outgoing, total],
  )

  const endAnim = useCallback(() => {
    setOutgoing(null)
    setDirection("none")
  }, [])

  return { active, outgoing, direction, go, endAnim }
}

export function TourGallery({
  images,
  alt = "",
  slides: slidesProp,
}: {
  images?: string[]
  alt?: string
  slides?: GallerySlide[]
}) {
  const slides =
    slidesProp?.length
      ? slidesProp
      : (images?.length ? images : ["/placeholder.svg"]).map((url) => ({ url, alt }))
  const list = slides.map((s) => s.url)
  const total = slides.length
  const { active, outgoing, direction, go, endAnim } = useSlider(total)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const thumbnailsRef = useRef<HTMLDivElement>(null)
  const mainSlideRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Thumbnail column's content (up to 7+ thumbnails) is naturally taller than
  // the 16:9 main slide, so flex stretch alone can't cap it — measure the main
  // slide's real height on desktop and pin the column to match it exactly.
  const [desktopColumnHeight, setDesktopColumnHeight] = useState<number | null>(null)

  useEffect(() => {
    const mainEl = mainSlideRef.current
    if (!mainEl || typeof ResizeObserver === "undefined" || typeof window === "undefined") return
    const mq = window.matchMedia("(min-width: 768px)")
    const update = () => {
      setDesktopColumnHeight(mq.matches ? mainEl.getBoundingClientRect().height : null)
    }
    const ro = new ResizeObserver(update)
    ro.observe(mainEl)
    mq.addEventListener("change", update)
    update()
    return () => {
      ro.disconnect()
      mq.removeEventListener("change", update)
    }
  }, [])

  const activeAlt =
    slides[active]?.alt && total > 1
      ? `${slides[active].alt} — ${mediaLabel(slides[active])} ${active + 1}`
      : slides[active]?.alt || ""

  const updateThumbnailScroll = useCallback(() => {
    const element = thumbnailsRef.current
    if (!element) return
    setCanScrollUp(element.scrollTop > 0 || element.scrollLeft > 0)
    setCanScrollDown(
      element.scrollTop + element.clientHeight < element.scrollHeight - 1 ||
      element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
    )
  }, [])

  useEffect(() => {
    updateThumbnailScroll()
    const element = thumbnailsRef.current
    if (!element) return
    element.addEventListener("scroll", updateThumbnailScroll)
    return () => element.removeEventListener("scroll", updateThumbnailScroll)
  }, [total, updateThumbnailScroll])

  useEffect(() => {
    if (outgoing === null) return
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current)
    // Safari sometimes skips animationend — clear outgoing anyway
    fallbackTimer.current = setTimeout(endAnim, 400)
    return () => {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current)
    }
  }, [outgoing, endAnim])

  function scrollThumbnails(dir: "up" | "down") {
    thumbnailsRef.current?.scrollBy({
      top: dir === "up" ? -112 : 112,
      left: dir === "up" ? -104 : 104,
      behavior: "smooth",
    })
  }

  const dragStart = useRef<number | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("video, button")) return
    dragStart.current = e.clientX
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStart.current === null) return
    const dx = e.clientX - dragStart.current
    if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1))
    dragStart.current = null
  }

  const enterClass =
    direction === "left"
      ? "animate-slide-in-left"
      : direction === "right"
        ? "animate-slide-in-right"
        : ""
  const exitClass =
    direction === "left"
      ? "animate-slide-out-left"
      : direction === "right"
        ? "animate-slide-out-right"
        : ""

  const activeSlide = slides[active]
  const outgoingSlide = outgoing !== null ? slides[outgoing] : null

  return (
    <>
      {/* Mobile: column. Desktop: row. Main slide's aspect-ratio is the ONLY source of
          height — use md:items-start (NOT stretch) so the naturally taller thumbnail
          column can't stretch the main slide past its 16:9 box (that caused letterboxing
          + a ResizeObserver feedback loop). The column is pinned to the measured main
          slide height below and scrolls its own overflow via the up/down buttons. */}
      <div className="flex w-full min-w-0 select-none flex-col gap-3 md:flex-row md:items-start md:gap-3">
        <div
          ref={mainSlideRef}
          className="relative aspect-[16/9] w-full min-h-[180px] shrink-0 overflow-hidden rounded-xl bg-cream md:min-h-0 md:min-w-0 md:max-h-[70vh] md:flex-1"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {outgoingSlide ? (
            <div className={`absolute inset-0 ${exitClass} pointer-events-none`} aria-hidden>
              <SlideMedia slide={{ ...outgoingSlide, alt: "" }} sizes="(max-width: 768px) 100vw, 900px" muted />
            </div>
          ) : null}

          <div
            key={active}
            className={`absolute inset-0 ${outgoing !== null ? enterClass : ""}`}
            onAnimationEnd={endAnim}
          >
            {activeSlide ? (
              <SlideMedia
                slide={{ ...activeSlide, alt: activeAlt }}
                sizes="(max-width: 768px) 100vw, 900px"
                priority={active === 0}
                controls={isVideoUrl(activeSlide.url)}
              />
            ) : null}
          </div>

          {activeSlide && isVideoUrl(activeSlide.url) ? (
            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <Play className="h-3.5 w-3.5 fill-white" aria-hidden /> Видео
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent" />

          {total > 1 && (
            <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {active + 1} / {total}
            </div>
          )}

          <button
            type="button"
            onClick={() => setLightbox(active)}
            onPointerEnter={() => void loadLightbox()}
            onTouchStart={() => void loadLightbox()}
            onFocus={() => void loadLightbox()}
            aria-label="Открыть полноэкранный просмотр"
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white touch-manipulation backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:right-4 sm:top-4"
          >
            <Expand className="h-4 w-4" aria-hidden />
          </button>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(active - 1, "right")}
                aria-label={`Предыдущее ${mediaLabel(slides[(active - 1 + total) % total])}`}
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white transition-all hover:scale-105 hover:bg-brand-dark active:scale-95"
              >
                <ChevronLeft className="h-6 w-6 stroke-2" />
              </button>

              <button
                type="button"
                onClick={() => go(active + 1, "left")}
                aria-label={`Следующее ${mediaLabel(slides[(active + 1) % total])}`}
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white transition-all hover:scale-105 hover:bg-brand-dark active:scale-95"
              >
                <ChevronRight className="h-6 w-6 stroke-2" />
              </button>

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                {list.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`${mediaLabel(slides[i])} ${i + 1}`}
                    aria-current={i === active}
                    className={`rounded-full transition-all duration-300 ${
                      i === active ? "h-2 w-6 bg-white" : "h-2 w-2 bg-white/45 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {total > 1 && (
          <div
            className="flex w-full gap-2 py-1 md:w-40 md:flex-none md:flex-col md:gap-2 md:py-0 lg:w-48"
            style={desktopColumnHeight ? { height: desktopColumnHeight } : undefined}
          >
            <button
              type="button"
              onClick={() => scrollThumbnails("up")}
              disabled={!canScrollUp}
              aria-label="Предыдущие миниатюры"
              className="hidden h-20 w-8 shrink-0 items-center justify-center rounded bg-cream text-ink transition-colors hover:bg-brand/20 disabled:opacity-40 md:flex md:h-8 md:w-full"
            >
              <ChevronLeft className="h-5 w-5 md:hidden" />
              <ChevronUp className="hidden h-5 w-5 md:block" />
            </button>
            <div
              ref={thumbnailsRef}
              className="flex min-w-0 gap-2 overflow-x-auto scrollbar-none [touch-action:pan-x] [overscroll-behavior:contain] [-webkit-overflow-scrolling:touch] md:min-h-0 md:flex-1 md:flex-col md:overflow-x-hidden md:overflow-y-auto md:[touch-action:pan-y]"
              style={{ scrollbarWidth: "none" } as React.CSSProperties}
            >
              {slides.map((slide, i) => {
                const video = isVideoUrl(slide.url)
                const isActive = i === active
                return (
                  <button
                    key={slide.url + i}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Показать ${mediaLabel(slide)} ${i + 1}`}
                    aria-current={isActive}
                    className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-lg transition-all duration-200 md:h-24 md:w-full lg:h-28 ${
                      isActive
                        ? "ring-2 ring-brand ring-offset-2 opacity-100"
                        : "opacity-60 hover:opacity-90"
                    }`}
                  >
                    <SlideMedia
                      slide={{ ...slide, alt: "" }}
                      sizes="(max-width: 767px) 96px, 192px"
                      objectFit="cover"
                      muted
                    />
                    {video && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="flex h-7 w-9 items-center justify-center rounded-xl bg-black/55">
                          <Play className="ml-0.5 h-3.5 w-3.5 fill-white text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => scrollThumbnails("down")}
              disabled={!canScrollDown}
              aria-label="Следующие миниатюры"
              className="hidden h-20 w-8 shrink-0 items-center justify-center rounded bg-cream text-ink transition-colors hover:bg-brand/20 disabled:opacity-40 md:flex md:h-8 md:w-full"
            >
              <ChevronRight className="h-5 w-5 md:hidden" />
              <ChevronDown className="hidden h-5 w-5 md:block" />
            </button>
          </div>
        )}
      </div>

      {lightbox !== null && (
        <TourGalleryLightbox
          slides={slides}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNav={setLightbox}
        />
      )}
    </>
  )
}
