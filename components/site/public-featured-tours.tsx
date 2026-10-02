import { FeaturedTours } from "@/components/site/featured-tours"
import { getCurrencies } from "@/lib/public/currencies-server"
import { expandPublicList } from "@/lib/expand-content-blocks"
import { toTourCard } from "@/lib/tour-card"
import type { Tour } from "@/lib/types"
import type { ComponentProps } from "react"

type WithFullTours<P> = Omit<P, "tours"> & { tours: Tour[] }

/**
 * Server boundary для блока «Популярные туры» на главной.
 *
 * Живёт в отдельном файле от PublicToursListing намеренно: webpack собирает
 * все клиентские компоненты, на которые ссылается один серверный модуль, в
 * общую группу чанков страницы. Пока оба boundary лежали в public-tours.tsx,
 * главная тянула чанки каталога (flatpickr, radix-slider, фильтры) — ~80 КБ
 * JS, которые на ней никогда не исполнялись.
 */
export async function PublicFeaturedTours(props: WithFullTours<ComponentProps<typeof FeaturedTours>>) {
  const [tours, currencies] = await Promise.all([
    expandPublicList(props.tours.map(toTourCard)),
    props.currencies ? Promise.resolve(props.currencies) : getCurrencies(),
  ])
  return <FeaturedTours {...props} tours={tours} currencies={currencies} />
}
