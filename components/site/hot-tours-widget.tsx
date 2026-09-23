"use client"

import { useEffect, useRef, useState } from "react"
import { TourvisorFacade } from "@/components/site/tourvisor-facade"
import { useSuppressTourvisorRejections, useTourvisorInteractionGate } from "@/components/site/tourvisor-lazy"
import { injectTourvisorInit, teardownTourvisorHost } from "@/lib/tourvisor-widget"

/**
 * Виджет горящих туров. init.js грузим только после действия пользователя,
 * до этого — статичный фасад той же высоты (см. useTourvisorInteractionGate).
 */
export function HotToursWidget() {
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
  }, [ready])

  return (
    <div className="relative min-h-[220px]">
      {!loaded && <TourvisorFacade variant="hot" loading={ready} onActivate={arm} />}
      <div
        ref={hostRef}
        className="tv-hot-tours tv-moduleid-9986280"
        style={loaded ? undefined : { position: "absolute", inset: 0, opacity: 0, pointerEvents: "none" }}
      />
    </div>
  )
}
