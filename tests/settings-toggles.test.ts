import { describe, expect, it } from "vitest"
import { normalizeDeclaredToggles, parseDeclaredToggles } from "@/lib/settings-toggles"

describe("parseDeclaredToggles", () => {
  it("разбирает список ключей через запятую", () => {
    expect(parseDeclaredToggles("a.visible, b.section.faq ,c")).toEqual(["a.visible", "b.section.faq", "c"])
  })

  it("пустое/отсутствующее поле — пустой список", () => {
    expect(parseDeclaredToggles("")).toEqual([])
    expect(parseDeclaredToggles(null)).toEqual([])
    expect(parseDeclaredToggles(undefined)).toEqual([])
  })
})

describe("normalizeDeclaredToggles", () => {
  it("объявленный включённый тоггл → '1', выключенный → '0'", () => {
    const out = normalizeDeclaredToggles(
      ["home.section.hero", "home.section.faq"],
      (key) => key === "home.section.hero",
      new Set(),
    )
    expect(out).toEqual({ "home.section.hero": "1", "home.section.faq": "0" })
  })

  it("РЕГРЕССИЯ: не трогает ключи видимости чужих страниц, не объявленные формой", () => {
    // Симуляция бага: в БД есть ключи видимости других страниц
    // (bustours.section.countries и т.п.), но форма города объявила только свои.
    const declared = parseDeclaredToggles("") // формы страниц шлют __toggles=""
    const out = normalizeDeclaredToggles(declared, () => false, new Set())
    // Ни один чужой ключ не должен попасть в сохранение со значением "0".
    expect(Object.keys(out)).toHaveLength(0)
  })

  it("ключи из __sectionVisibility (skipKeys) не перезаписываются чекбоксами", () => {
    const out = normalizeDeclaredToggles(
      ["home.section.hero", "home.notify"],
      () => false,
      new Set(["home.section.hero"]),
    )
    expect(out).toEqual({ "home.notify": "0" })
  })
})
