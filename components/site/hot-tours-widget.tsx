"use client"

import { useEffect, useRef, useState } from "react"
import { TourvisorFacade } from "@/components/site/tourvisor-facade"
import { useSuppressTourvisorRejections, useTourvisorInteractionGate } from "@/components/site/tourvisor-lazy"
import { injectTourvisorInit, teardownTourvisorHost } from "@/lib/tourvisor-widget"

interface Props {
  /** ID страны в справочнике Tourvisor — лента горящих туров только по ней */
  countryId?: number
  /** ID курорта в справочнике Tourvisor — сужает ленту до курорта */
  cityId?: number
}

/**
 * Виджет горящих туров. init.js грузим только после действия пользователя,
 * до этого — статичный фасад той же высоты (см. useTourvisorInteractionGate).
 *
 * Страну и курорт модуль читает с хоста через `tv-countries` / `tv-resorts`
 * (базовые inline-параметры модулей Tourvisor); без них лента общая.
 */
export function HotToursWidget({ countryId, cityId }: Props) {
  const [ready, arm] = useTourvisorInteractionGate()
  const [loaded, setLoaded] = useState(false)
  const hostRef = useRef<HTMLDivElement>(null)

  useSuppressTourvisorRejections()

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
  }, [ready, countryId, cityId])

  return (
    <div className="relative min-h-[220px]">
      {!loaded && <TourvisorFacade variant="hot" loading={ready} onActivate={arm} />}
      <div
        key={`${countryId ?? ""}-${cityId ?? ""}`}
        ref={hostRef}
        className="tv-hot-tours tv-moduleid-9986280"
        tv-countries={countryId ?? undefined}
        tv-resorts={cityId ?? undefined}
        style={loaded ? undefined : { position: "absolute", inset: 0, opacity: 0, pointerEvents: "none" }}
      />
    </div>
  )
}
