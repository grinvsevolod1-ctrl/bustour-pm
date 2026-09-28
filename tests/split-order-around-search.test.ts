import { describe, expect, it } from "vitest"
import { splitOrderAroundSearch } from "@/lib/section-order"

describe("splitOrderAroundSearch", () => {
  it("callus в начале порядка уходит в зону под H1", () => {
    expect(splitOrderAroundSearch(["callus", "search", "cities", "faq"])).toEqual({
      top: ["callus"],
      beforeSearch: [],
      afterSearch: ["cities", "faq"],
    })
  })

  it("секции до search выводятся перед виджетом", () => {
    expect(splitOrderAroundSearch(["cities", "callus", "search", "seo"])).toEqual({
      top: [],
      beforeSearch: ["cities", "callus"],
      afterSearch: ["seo"],
    })
  })

  it("старый порядок без search: виджет первым, как раньше", () => {
    expect(splitOrderAroundSearch(["cities", "seo", "callus", "faq"])).toEqual({
      top: [],
      beforeSearch: [],
      afterSearch: ["cities", "seo", "callus", "faq"],
    })
  })

  it("callus первым даже в старом порядке без search поднимается под H1", () => {
    expect(splitOrderAroundSearch(["callus", "callus2", "seo"]).top).toEqual(["callus", "callus2"])
  })
})
