import { FeaturedTours } from "@/components/site/featured-tours"
import { ToursListing } from "@/components/site/tours-listing"
import { getCurrencies } from "@/lib/currencies-server"
import { expandPublicList } from "@/lib/expand-content-blocks"
import { getShortcodesDict } from "@/lib/shortcodes"
import { toTourCard } from "@/lib/tour-card"
import type { Tour } from "@/lib/types"
import type { ComponentProps } from "react"

type WithFullTours<P> = Omit<P, "tours"> & { tours: Tour[] }

/**
 * Server boundary: сначала режем тур до данных карточки (toTourCard), потом
 * раскрываем шорткоды — так `[Y]` и прочие не гоняются по программе и SEO-тексту,
 * которые в листинг всё равно не попадают, а клиент получает компактный payload.
 */
export async function PublicFeaturedTours(props: WithFullTours<ComponentProps<typeof FeaturedTours>>) {
  const [tours, currencies] = await Promise.all([
    expandPublicList(props.tours.map(toTourCard)),
    props.currencies ? Promise.resolve(props.currencies) : getCurrencies(),
  ])
  return <FeaturedTours {...props} tours={tours} currencies={currencies} />
}

export async function PublicToursListing(props: WithFullTours<ComponentProps<typeof ToursListing>>) {
  const [tours, shortcodesDict] = await Promise.all([
    expandPublicList(props.tours.map(toTourCard)),
    getShortcodesDict(),
  ])
  return <ToursListing {...props} tours={tours} shortcodesDict={shortcodesDict} />
}
