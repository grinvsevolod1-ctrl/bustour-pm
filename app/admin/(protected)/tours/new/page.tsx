import { TourForm } from "@/components/admin/tour-form"
import { SetupGuide } from "@/components/admin/setup-guide"
import { buildTourGuide } from "@/lib/setup-guide-builders"
import { getCountries } from "@/lib/countries"
import { getCityDestinations } from "@/lib/cities"
import { getCurrencies } from "@/lib/currencies-server"
import { getBusTourTypes } from "@/lib/bus-tour-types"

export default async function NewTourPage() {
  const [countries, cities, currencies, tourTypes] = await Promise.all([
    getCountries("bus"),
    getCityDestinations("bus"),
    getCurrencies(),
    getBusTourTypes(),
  ])
  // Новый тур: первый шаг активен, остальные заблокированы до сохранения —
  // гид сразу показывает весь путь настройки вместо пассивной подсказки.
  const guide = buildTourGuide({ tourVisible: false, tourMeta: {} })

  return (
    <div className="space-y-6">
      <SetupGuide data={guide} />
      <TourForm
        countries={countries}
        cities={cities}
        currencies={currencies}
        tourTypes={tourTypes.map((t) => t.name)}
      />
    </div>
  )
}
