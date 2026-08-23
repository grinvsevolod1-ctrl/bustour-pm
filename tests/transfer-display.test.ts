import { describe, expect, it } from "vitest"
import { ensureSchedulesInOrder } from "../lib/transfer-display"

// Регрессия: легаси sections.order без "schedules" гасил расписания
// на публичной странице трансфера, хотя рейсы есть в БД.
describe("ensureSchedulesInOrder", () => {
  it("не трогает порядок, где schedules уже есть", () => {
    const order = ["seo", "schedules", "faq", "callus"]
    expect(ensureSchedulesInOrder(order)).toBe(order)
  })

  it("вставляет schedules после первого seo-блока", () => {
    expect(ensureSchedulesInOrder(["seo", "faq", "callus"])).toEqual([
      "seo",
      "schedules",
      "faq",
      "callus",
    ])
  })

  it("учитывает нумерованные seo-блоки (seo2, seo3)", () => {
    expect(ensureSchedulesInOrder(["seo2", "faq"])).toEqual(["seo2", "schedules", "faq"])
  })

  it("ставит schedules в начало, если seo-блоков нет", () => {
    expect(ensureSchedulesInOrder(["faq", "callus"])).toEqual(["schedules", "faq", "callus"])
  })

  it("не мутирует исходный массив", () => {
    const order = ["seo", "faq"]
    ensureSchedulesInOrder(order)
    expect(order).toEqual(["seo", "faq"])
  })
})
