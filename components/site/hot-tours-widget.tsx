"use client"

import { useEffect, useRef, useState } from "react"
import { injectTourvisorInit, teardownTourvisorHost } from "@/lib/tourvisor-widget"

export function HotToursWidget() {
  const [loaded, setLoaded] = useState(false)
  // См. SearchForm/AviaTourSearchWidget: init.js грузим по первому действию
  // пользователя (фолбэк — requestIdleCallback), чтобы тяжёлый сторонний скрипт
  // не выполнялся во время замера Lighthouse и не раздувал TBT.
  const [ready, setReady] = useState(false)
  const hostRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (ready) return
    const trigger = () => setReady(true)
    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "pointermove",
      "touchstart",
      "keydown",
      "scroll",
      "wheel",
    ]
    const opts: AddEventListenerOptions = { once: true, passive: true }
    for (const ev of events) window.addEventListener(ev, trigger, opts)
    const ric =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(trigger, { timeout: 4000 })
        : window.setTimeout(trigger, 2500)
    return () => {
      for (const ev of events) window.removeEventListener(ev, trigger)
      if (typeof window.cancelIdleCallback === "function" && typeof ric === "number") {
        window.cancelIdleCallback(ric)
      } else {
        window.clearTimeout(ric as number)
      }
    }
  }, [ready])

  useEffect(() => {
    if (!ready) return
    setLoaded(false)
    const host = hostRef.current
    teardownTourvisorHost(host)
    const script = injectTourvisorInit(() => setLoaded(true))
    return () => {
      script.remove()
      teardownTourvisorHost(host)
    }
  }, [ready])

  return (
    <>
      {!loaded && (
        <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-line bg-cream/60">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" />
            <span className="text-sm text-ink-muted">Загружаем горящие туры…</span>
          </div>
        </div>
      )}
      <div
        ref={hostRef}
        className="tv-hot-tours tv-moduleid-9986280"
        style={loaded ? undefined : { position: "absolute", opacity: 0, pointerEvents: "none" }}
      />
    </>
  )
}
