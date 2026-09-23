import { describe, it, expect } from "vitest"
import { buildOpeningHours } from "@/lib/site-schema"
import type { SiteSettings } from "@/lib/types"

const s = (o: Record<string, string>) => o as unknown as SiteSettings

describe("buildOpeningHours — суббота попадает в schema.org из любого поля", () => {
  it("суббота из «Полного режима работы» (site.hoursFull)", () => {
    const spec = buildOpeningHours(
      s({ "site.hours": "10:00–18:00", "site.hoursFull": "пн–пт: 10:00–18:00\nсб: 11:00–16:00" }),
    )
    const sat = spec.find((x) => x.dayOfWeek.includes("Saturday"))
    expect(sat).toMatchObject({ opens: "11:00", closes: "16:00" })
    // Будни берутся из site.hours, суббота не перетирает их.
    expect(spec.find((x) => x.dayOfWeek.includes("Monday"))).toMatchObject({ opens: "10:00", closes: "18:00" })
  })

  it("суббота из «Примечания к часам» (site.hoursNote)", () => {
    const spec = buildOpeningHours(s({ "site.hours": "10:00–18:00", "site.hoursNote": "сб.: 11:00-16:00" }))
    const sat = spec.find((x) => x.dayOfWeek.includes("Saturday"))
    expect(sat).toMatchObject({ opens: "11:00", closes: "16:00" })
    expect(spec.find((x) => x.dayOfWeek.includes("Monday"))).toMatchObject({ opens: "10:00", closes: "18:00" })
  })

  it("примечание-«выходной» без времени не добавляет дней", () => {
    const spec = buildOpeningHours(s({ "site.hours": "10:00–18:00", "site.hoursNote": "сб. и вс. — выходной" }))
    expect(spec.some((x) => x.dayOfWeek.includes("Saturday"))).toBe(false)
    expect(spec.some((x) => x.dayOfWeek.includes("Sunday"))).toBe(false)
  })

  it("полный режим имеет приоритет над примечанием для одного и того же дня", () => {
    const spec = buildOpeningHours(
      s({
        "site.hours": "10:00–18:00",
        "site.hoursFull": "сб: 11:00–16:00",
        "site.hoursNote": "сб: 09:00–12:00",
      }),
    )
    const sats = spec.filter((x) => x.dayOfWeek.includes("Saturday"))
    expect(sats).toHaveLength(1)
    expect(sats[0]).toMatchObject({ opens: "11:00", closes: "16:00" })
  })
})
