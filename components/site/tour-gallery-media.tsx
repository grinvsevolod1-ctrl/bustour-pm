"use client"

import Image from "next/image"
import { extToType } from "@/lib/media/utils"

export type GallerySlide = { url: string; alt: string }

export function isVideoUrl(url: string) {
  return extToType(url.split(/[?#]/, 1)[0] ?? url) === "video"
}

export function mediaLabel(slide: GallerySlide | undefined) {
  return slide && isVideoUrl(slide.url) ? "видео" : "фото"
}

/** Один слайд галереи: <video> для видео, next/image для фото. Общий для слайдера и лайтбокса. */
export function SlideMedia({
  slide,
  priority,
  sizes,
  objectFit = "contain",
  controls = false,
  muted = false,
  className,
}: {
  slide: GallerySlide
  priority?: boolean
  sizes: string
  objectFit?: "contain" | "cover"
  controls?: boolean
  muted?: boolean
  className?: string
}) {
  const fit = objectFit === "cover" ? "object-cover" : "object-contain"
  if (isVideoUrl(slide.url)) {
    return (
      <video
        src={slide.url}
        className={`absolute inset-0 h-full w-full ${fit} ${className ?? ""}`}
        controls={controls}
        muted={muted}
        playsInline
        preload="metadata"
        aria-label={slide.alt || undefined}
      />
    )
  }
  return (
    <Image
      src={slide.url || "/placeholder.svg"}
      alt={slide.alt}
      fill
      sizes={sizes}
      className={`${fit} ${className ?? ""}`}
      priority={priority}
      draggable={false}
    />
  )
}
