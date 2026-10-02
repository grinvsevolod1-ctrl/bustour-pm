import { describe, it, expect } from "vitest"
import {
  normalizeGeoName,
  findTourvisorCountryId,
  findTourvisorResortId,
  resolveTourvisorCountryId,
  resolveTourvisorResortId,
  tourvisorWidgetGeo,
  tourvisorCountries,
  tourvisorResorts,
} from "@/lib/tourvisor-directory"

describe("normalizeGeoName", () => {
  it("снимает регистр, ё и пунктуацию; дефис равен пробелу", () => {
    expect(normalizeGeoName("  Шарм-Эль-Шейх ")).toBe("шарм эль шейх")
    expect(normalizeGeoName("Шарм эль Шейх")).toBe("шарм эль шейх")
    expect(normalizeGeoName("Шри-Ланка")).toBe(normalizeGeoName("Шри Ланка"))
    expect(normalizeGeoName("ОАЭ")).toBe("оаэ")
  })

  it("убирает маркетинговые префиксы горящих страниц", () => {
    expect(normalizeGeoName("Горящая Хургада")).toBe("хургада")
    expect(normalizeGeoName("Горящий Дубай")).toBe("дубай")
    expect(normalizeGeoName("Горящие туры в Турцию")).toBe("турцию")
  })

  it("приводит известные расхождения в написании к варианту Tourvisor", () => {
    expect(normalizeGeoName("Анталия")).toBe("анталья")
    expect(normalizeGeoName("Морокко")).toBe("марокко")
  })
})

describe("снимок справочника", () => {
  it("содержит страны и курорты с валидными связями", () => {
    expect(tourvisorCountries.length).toBeGreaterThan(50)
    expect(tourvisorResorts.length).toBeGreaterThan(1000)
    const countryIds = new Set(tourvisorCountries.map((c) => c.id))
    for (const r of tourvisorResorts.slice(0, 200)) expect(countryIds.has(r.countryId)).toBe(true)
  })
})

describe("подбор ID по названию", () => {
  it("находит страны сайта", () => {
    expect(findTourvisorCountryId("Турция")).toBe(4)
    expect(findTourvisorCountryId("Египет")).toBe(1)
    expect(findTourvisorCountryId("ОАЭ")).toBe(9)
    expect(findTourvisorCountryId("Нарния")).toBeUndefined()
    expect(findTourvisorCountryId("")).toBeUndefined()
  })

  it("находит курорты внутри страны и предпочитает верхний уровень при дублях", () => {
    expect(findTourvisorResortId(4, "Анталия")).toBe(20)
    expect(findTourvisorResortId(1, "Горящая Хургада")).toBe(5)
    expect(findTourvisorResortId(9, "Горящий Дубай")).toBe(45)
    // «Албена» есть и как регион (126), и как подрайон — берём регион.
    expect(findTourvisorResortId(20, "Албена")).toBe(126)
    // Подрайоны Хургады с другим написанием на сайте.
    expect(findTourvisorResortId(1, "Макади")).toBe(2527)
    expect(findTourvisorResortId(1, "Сахл Хашиш")).toBe(2526)
    // Курорт другой страны не подбирается.
    expect(findTourvisorResortId(4, "Хургада")).toBeUndefined()
  })
})

describe("resolve* и tourvisorWidgetGeo", () => {
  it("ручной ID из админки имеет приоритет над подбором", () => {
    expect(resolveTourvisorCountryId({ name: "Турция", tourvisorId: 999 })).toBe(999)
    expect(resolveTourvisorCountryId({ name: "Турция", tourvisorId: null })).toBe(4)
    expect(resolveTourvisorResortId({ name: "Анталия", tourvisorId: 21 }, 4)).toBe(21)
    expect(resolveTourvisorResortId({ name: "Анталия", tourvisorId: 0 }, 4)).toBe(20)
  })

  it("собирает пропсы виджета для страницы страны и курорта", () => {
    expect(tourvisorWidgetGeo({ name: "Турция", tourvisorId: null })).toEqual({ countryId: 4 })
    expect(tourvisorWidgetGeo({ name: "Турция", tourvisorId: null }, { name: "Анталия", tourvisorId: null })).toEqual({
      countryId: 4,
      cityId: 20,
    })
    expect(tourvisorWidgetGeo(undefined)).toEqual({})
  })

  it("восстанавливает страну по ручному ID курорта, если страна не определилась", () => {
    expect(tourvisorWidgetGeo({ name: "Неизвестно", tourvisorId: null }, { name: "X", tourvisorId: 45 })).toEqual({
      countryId: 9,
      cityId: 45,
    })
  })
})
