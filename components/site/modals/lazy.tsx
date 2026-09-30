"use client"

import dynamic from "next/dynamic"
import { useEffect, useState, type ComponentProps } from "react"
import type { ModalBusOrder } from "./modal-bus-order"
import type { ModalTestimonial } from "./modal-testimonial"
import type { ModalTourOrder } from "./modal-tour-order"

/**
 * Ленивые обёртки публичных модалок.
 *
 * Модалки тянут motion, libphonenumber (валидация телефона), flatpickr
 * (выбор даты) и reCAPTCHA-лоадер — вместе ~90 КБ gzip. Через barrel
 * `modals/index.ts` всё это попадало в первичный бандл любой страницы, где есть
 * хотя бы кнопка «Оставить отзыв» или «Забронировать». Здесь чанк модалки
 * запрашивается только при первом открытии (или заранее через preload* по
 * hover/touchstart на триггере), а после закрытия компонент остаётся
 * смонтированным — так работает exit-анимация AnimatePresence внутри shell.
 */

const loadTourOrder = () => import("./modal-tour-order").then((m) => m.ModalTourOrder)
const loadBusOrder = () => import("./modal-bus-order").then((m) => m.ModalBusOrder)
const loadTestimonial = () => import("./modal-testimonial").then((m) => m.ModalTestimonial)

export const preloadModalTourOrder = () => void loadTourOrder()
export const preloadModalBusOrder = () => void loadBusOrder()
export const preloadModalTestimonial = () => void loadTestimonial()

const TourOrderImpl = dynamic(loadTourOrder, { ssr: false })
const BusOrderImpl = dynamic(loadBusOrder, { ssr: false })
const TestimonialImpl = dynamic(loadTestimonial, { ssr: false })

/** true с момента первого open=true и далее навсегда (для exit-анимации). */
function useEverOpened(open: boolean): boolean {
  const [ever, setEver] = useState(open)
  useEffect(() => {
    if (open) setEver(true)
  }, [open])
  return ever || open
}

export function LazyModalTourOrder(props: ComponentProps<typeof ModalTourOrder>) {
  if (!useEverOpened(props.open)) return null
  return <TourOrderImpl {...props} />
}

export function LazyModalBusOrder(props: ComponentProps<typeof ModalBusOrder>) {
  if (!useEverOpened(props.open)) return null
  return <BusOrderImpl {...props} />
}

export function LazyModalTestimonial(props: ComponentProps<typeof ModalTestimonial>) {
  if (!useEverOpened(props.open)) return null
  return <TestimonialImpl {...props} />
}
