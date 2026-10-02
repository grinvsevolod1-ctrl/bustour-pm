import { ToursListing } from "@/components/site/tours-listing"
import { expandPublicList } from "@/lib/expand-content-blocks"
import { getShortcodesDict } from "@/lib/shortcodes"
import { toTourCard } from "@/lib/tour-card"
import type { Tour } from "@/lib/types"
import type { ComponentProps } from "react"

type WithFullTours<P> = Omit<P, "tours"> & { tours: Tour[] }

/**
 * Server boundary каталога: сначала режем тур до данных карточки (toTourCard),
 * потом раскрываем шорткоды — так `[Y]` и прочие не гоняются по программе и
 * SEO-тексту, которые в листинг всё равно не попадают, а клиент получает
 * компактный payload.
 *
 * Блок «Популярные туры» главной — в public-featured-tours.tsx (отдельный
 * файл, чтобы главная не тянула чанки фильтров каталога).
 */
export async function PublicToursListing(props: WithFullTours<ComponentProps<typeof ToursListing>>) {
  const [tours, shortcodesDict] = await Promise.all([
    expandPublicList(props.tours.map(toTourCard)),
    getShortcodesDict(),
  ])
  return <ToursListing {...props} tours={tours} shortcodesDict={shortcodesDict} />
}
