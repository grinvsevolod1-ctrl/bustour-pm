/**
 * /tour/[slug] — legacy URL, permanently redirected to the new canonical URL.
 *
 * New structure:
 *   /avtobusnye-tury/{countrySlug}/{citySlug}/{tourSlug}/
 */
import { notFound, permanentRedirect } from "next/navigation"
import { getTour, getSlugMaps } from "@/lib/public/queries"
import { tourUrl } from "@/lib/tour-url"
import { isTourVisiblePublic } from "@/lib/cms"

export const dynamic = "force-dynamic"

export default async function LegacyTourRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // Тур и карты слагов не зависят друг от друга; видимость читаем из того же
  // кеша настроек, что и остальной сайт (без отдельного скана site_settings).
  const [tour, slugMaps] = await Promise.all([getTour(slug), getSlugMaps()])
  if (!tour || !(await isTourVisiblePublic(tour.slug))) notFound()

  const url = tourUrl({
    tourSlug: tour.slug,
    countrySlug: slugMaps.countrySlugById[tour.countryId],
    citySlug: slugMaps.citySlugById[tour.arrivalCityId],
  })
  if (!url) notFound()

  // 308, а не 307: старый URL переехал навсегда — поисковики переносят вес
  // на канонический адрес, а браузеры кешируют редирект.
  permanentRedirect(url)
}
