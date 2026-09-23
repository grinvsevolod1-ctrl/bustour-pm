"use client"

import { useCallback, useEffect, useState } from "react"

const INTERACTION_EVENTS: (keyof WindowEventMap)[] = [
  "pointerdown",
  "pointermove",
  "touchstart",
  "keydown",
  "scroll",
  "wheel",
]

/**
 * Единый «шлагбаум» для тяжёлых сторонних виджетов (Tourvisor).
 *
 * ready становится true ТОЛЬКО по реальному действию пользователя (любое
 * касание/движение/скролл/клавиша в окне) или по явному вызову arm() —
 * например, по клику на статичный фасад формы.
 *
 * Таймерного/idle-фолбэка здесь НЕТ намеренно:
 * Lighthouse не взаимодействует со страницей, но простой главного потока
 * наступает сразу после гидратации, и idle-фолбэк подгружал init.js прямо во
 * время замера — сторонний скрипт снова попадал в Total Blocking Time и всю
 * «ленивость» PageSpeed не видел. Для живого человека ничего не меняется:
 * он трогает страницу в первую же секунду, а если нет — кликает по фасаду.
 */
export function useTourvisorInteractionGate(): [boolean, () => void] {
  const [ready, setReady] = useState(false)
  const arm = useCallback(() => setReady(true), [])

  useEffect(() => {
    if (ready) return
    const opts: AddEventListenerOptions = { once: true, passive: true }
    for (const ev of INTERACTION_EVENTS) window.addEventListener(ev, arm, opts)
    return () => {
      for (const ev of INTERACTION_EVENTS) window.removeEventListener(ev, arm)
    }
  }, [ready, arm])

  return [ready, arm]
}

/**
 * Tourvisor делает XHR к своему серверу. На неавторизованных доменах (preview)
 * запросы падают как unhandledRejection — гасим их, чтобы не сыпать в консоль.
 */
export function useSuppressTourvisorRejections(): void {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message ?? String(event.reason)
      if (msg.includes("sessionKey") || msg.includes("tourvisor")) {
        event.preventDefault()
      }
    }
    window.addEventListener("unhandledrejection", handler)
    return () => window.removeEventListener("unhandledrejection", handler)
  }, [])
}
