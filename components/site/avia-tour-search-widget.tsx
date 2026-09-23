"use client"

import { useEffect, useRef, useState } from "react"
import { TourvisorFacade } from "@/components/site/tourvisor-facade"
import { useSuppressTourvisorRejections, useTourvisorInteractionGate } from "@/components/site/tourvisor-lazy"
import { injectTourvisorInit, teardownTourvisorHost } from "@/lib/tourvisor-widget"

interface Props {
  /** Tourvisor country ID to preselect in the widget */
  countryId?: number
  /** Tourvisor city/resort ID to preselect in the widget */
  cityId?: number
}

/**
 * Виджет поиска авиатуров. init.js грузим только после действия пользователя
 * (фасад до этого), при смене страны/города — переинициализируем.
 */
export function AviaTourSearchWidget({ countryId, cityId }: Props) {
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
      {!loaded && <TourvisorFacade variant="search" loading={ready} onActivate={arm} />}
      <div
        key={`${countryId ?? ""}-${cityId ?? ""}`}
        ref={hostRef}
        className="tv-search-form tv-moduleid-9974602"
        data-country={countryId ?? undefined}
        data-city={cityId ?? undefined}
        style={loaded ? undefined : { position: "absolute", inset: 0, opacity: 0, pointerEvents: "none" }}
      />
    </div>
  )
}
