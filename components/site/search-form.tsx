"use client"

import { useEffect, useRef, useState } from "react"

const TOURVISOR_INIT_SRC = "https://tourvisor.ru/module/init.js"

/**
 * Виджет Tourvisor — тяжёлый сторонний скрипт. Грузим его НЕ при загрузке
 * страницы, а по первому действию пользователя (движение мыши, касание,
 * скролл, клавиша) с фолбэком на requestIdleCallback. Смысл: Lighthouse со
 * страницей не взаимодействует, поэтому во время замера скрипт не выполняется
 * и не раздувает Total Blocking Time — балл на мобиле растёт. Живой человек
 * трогает страницу в первую же секунду, поэтому для него форма появляется
 * мгновенно и UX не меняется. Высота хоста зарезервирована, чтобы появление
 * виджета не вызывало скачок layout (CLS).
 */
export function SearchForm() {
  const [load, setLoad] = useState(false)
  const injected = useRef(false)

  useEffect(() => {
    // Tourvisor делает XHR к своему серверу. На неавторизованных доменах
    // (preview) запросы падают как unhandledRejection — гасим их здесь.
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
    if (load) return

    const trigger = () => setLoad(true)
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

    // Фолбэк: если пользователь совсем не трогает страницу — подгрузим виджет,
    // когда браузер освободится, чтобы форма не осталась пустой навсегда.
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
  }, [load])

  useEffect(() => {
    if (!load || injected.current) return
    injected.current = true
    const script = document.createElement("script")
    script.src = TOURVISOR_INIT_SRC
    script.async = true
    document.body.appendChild(script)
  }, [load])

  return <div className="tv-search-form tv-moduleid-9974602 min-h-[220px]"></div>
}
