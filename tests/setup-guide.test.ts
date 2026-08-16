import { describe, expect, it } from "vitest"
import { buildCmsSteps, computeProgress, type SetupStep } from "@/lib/setup-guide"

const step = (over: Partial<SetupStep>): SetupStep => ({
  id: "s",
  label: "Шаг",
  description: "",
  done: false,
  ...over,
})

describe("computeProgress", () => {
  it("считает только обязательные шаги в знаменателе", () => {
    const progress = computeProgress([
      step({ id: "a", done: true }),
      step({ id: "b", done: false }),
      step({ id: "seo", done: false, optional: true }),
    ])
    expect(progress.total).toBe(2)
    expect(progress.done).toBe(1)
    expect(progress.complete).toBe(false)
  })

  it("следующий шаг — первый невыполненный обязательный", () => {
    const progress = computeProgress([
      step({ id: "a", done: true }),
      step({ id: "b", done: false }),
      step({ id: "c", done: false }),
    ])
    expect(progress.next?.id).toBe("b")
  })

  it("когда обязательные готовы, предлагает невыполненный optional", () => {
    const progress = computeProgress([
      step({ id: "a", done: true }),
      step({ id: "seo", done: false, optional: true }),
    ])
    expect(progress.complete).toBe(true)
    expect(progress.next?.id).toBe("seo")
  })

  it("всё готово: next = null, complete = true", () => {
    const progress = computeProgress([
      step({ id: "a", done: true }),
      step({ id: "seo", done: true, optional: true }),
    ])
    expect(progress.complete).toBe(true)
    expect(progress.next).toBeNull()
  })

  it("пустой список шагов — complete (нечего настраивать)", () => {
    const progress = computeProgress([])
    expect(progress.complete).toBe(true)
    expect(progress.total).toBe(0)
  })
})

describe("buildCmsSteps", () => {
  const groups = [
    { id: "main", label: "Основное", badge: true, anchorIds: ["s-base"] },
    { id: "content", label: "Контент", badge: false, anchorIds: ["sec-faq"] },
    { id: "seo", label: "SEO", badge: false, anchorIds: ["s-seo"] },
    { id: "order", label: "Порядок секций", badge: true, anchorIds: ["sec-order"] },
  ]

  it("исключает служебную вкладку «Порядок секций»", () => {
    const steps = buildCmsSteps(groups)
    expect(steps.map((s) => s.id)).toEqual(["main", "content", "seo"])
  })

  it("badge → done, первый anchorId → anchor", () => {
    const steps = buildCmsSteps(groups)
    expect(steps[0].done).toBe(true)
    expect(steps[0].anchor).toBe("s-base")
    expect(steps[1].done).toBe(false)
  })

  it("SEO-группа становится optional", () => {
    const steps = buildCmsSteps(groups)
    expect(steps.find((s) => s.id === "seo")?.optional).toBe(true)
    expect(steps.find((s) => s.id === "main")?.optional).toBeFalsy()
  })

  it("прогресс CMS-страницы не блокируется SEO-группой", () => {
    const steps = buildCmsSteps([
      { id: "main", label: "Основное", badge: true, anchorIds: ["a"] },
      { id: "seo", label: "SEO", badge: false, anchorIds: ["b"] },
    ])
    expect(computeProgress(steps).complete).toBe(true)
  })
})
