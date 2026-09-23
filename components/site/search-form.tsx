"use client"

import { useEffect, useRef, useState } from "react"
import { TourvisorFacade } from "@/components/site/tourvisor-facade"
import { useSuppressTourvisorRejections, useTourvisorInteractionGate } from "@/components/site/tourvisor-lazy"

const TOURVISOR_INIT_SRC = "https://tourvisor.ru/module/init.js"

/**
 * Виджет поиска Tourvisor на главной. Сторонний init.js грузим только после
 * реального действия пользователя (см. useTourvisorInteractionGate) — до этого
 * на его месте стоит статичный фасад той же высоты. Скрипт инжектим сами и
 * НЕ помечаем inject-атрибутом: scoped-remover авиа/горящих виджетов не должен
 * его трогать (см. tourvisor-widget-lifecycle.selfcheck).
 */
export function SearchForm() {
  const [ready, arm] = useTourvisorInteractionGate()
  const [loaded, setLoaded] = useState(false)
  const injected = useRef(false)

  useSuppressTourvisorRejections()

  useEffect(() => {
    if (!ready || injected.current) return
    injected.current = true
    const script = document.createElement("script")
    script.src = TOURVISOR_INIT_SRC
    script.async = true
    script.onload = () => setLoaded(true)
    script.onerror = () => setLoaded(true)
    document.body.appendChild(script)
  }, [ready])

  return (
    <div className="relative min-h-[220px]">
      {!loaded && <TourvisorFacade variant="search" loading={ready} onActivate={arm} />}
      <div
        className="tv-search-form tv-moduleid-9974602"
        style={loaded ? undefined : { position: "absolute", inset: 0, opacity: 0, pointerEvents: "none" }}
      />
    </div>
  )
}
