import type { DatesTable, Tour } from "@/lib/types"

/**
 * Данные тура для карточки в листинге и фильтров каталога.
 *
 * Листинги и «Похожие направления» — клиентские деревья: всё, что попадает в
 * их props, сериализуется в HTML страницы. Полный `Tour` тащит программу по
 * дням (до 30–40 КБ HTML на тур), SEO-текст, галерею, документы и раскладку
 * секций — на странице каталога это давало ~1,5 МБ HTML. Карточке из этого не
 * нужно ничего, фильтрам — только даты заездов.
 */
export type TourCardData = Pick<
  Tour,
  | "id"
  | "slug"
  | "title"
  | "description"
  | "price"
  | "priceAmount"
  | "extraPriceAmount"
  | "extraPriceCurrency"
  | "datesCurrency"
  | "image"
  | "tourType"
  | "duration"
  | "departure"
  | "country"
  | "countryId"
  | "countrySlug"
  | "arrivalCityId"
  | "citySlug"
  | "nights"
  | "featured"
  | "sortOrder"
  | "datesTable"
>

/** Фильтрам по периоду/дате выезда нужны только startDate/endDate строк. */
function slimDatesTable(table: DatesTable): DatesTable {
  return {
    note: "",
    noteType: table.noteType,
    currency: table.currency,
    footnotes: [],
    rows: table.rows.map((row) => ({
      startDate: row.startDate,
      endDate: row.endDate,
      description: "",
      tags: [],
      rooms: [],
    })),
  }
}

export function toTourCard(tour: Tour): TourCardData {
  return {
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    description: tour.description,
    price: tour.price,
    priceAmount: tour.priceAmount,
    extraPriceAmount: tour.extraPriceAmount,
    extraPriceCurrency: tour.extraPriceCurrency,
    datesCurrency: tour.datesCurrency,
    image: tour.image,
    tourType: tour.tourType,
    duration: tour.duration,
    departure: tour.departure,
    country: tour.country,
    countryId: tour.countryId,
    countrySlug: tour.countrySlug,
    arrivalCityId: tour.arrivalCityId,
    citySlug: tour.citySlug,
    nights: tour.nights,
    featured: tour.featured,
    sortOrder: tour.sortOrder,
    datesTable: slimDatesTable(tour.datesTable),
  }
}
