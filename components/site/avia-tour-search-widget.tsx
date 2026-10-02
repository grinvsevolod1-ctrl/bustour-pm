"use client"

import { useEffect, useRef, useState } from "react"
import { TourvisorFacade } from "@/components/site/tourvisor-facade"
import { useSuppressTourvisorRejections, useTourvisorInteractionGate } from "@/components/site/tourvisor-lazy"
import { injectTourvisorInit, teardownTourvisorHost } from "@/lib/tourvisor-widget"

interface Props {
  /** ID страны в справочнике Tourvisor — направление, с которым откроется форма */
  countryId?: number
  /** ID курорта в справочнике Tourvisor — предвыбранный курорт внутри страны */
  cityId?: number
}

/**
 * Виджет поиска авиатуров. init.js грузим только после действия пользователя
 * (фасад до этого), при смене страны/курорта — переинициализируем.
 *
 * Страну и курорт модуль читает с хоста через атрибуты `tv-country` /
 * `tv-resorts` (так их парсит core Tourvisor: getAttribute("tv-country"));
 * без них модуль показывает направление по умолчанию из настроек кабинета,
 * одинаковое на всех страницах.
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
        tv-country={countryId ?? undefined}
        tv-resorts={cityId ?? undefined}
        style={loaded ? undefined : { position: "absolute", inset: 0, opacity: 0, pointerEvents: "none" }}
      />
    </div>
  )
}
