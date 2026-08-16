import { describe, expect, it } from "vitest"
import {
  buildAutoDescription,
  buildAutoTitle,
  deriveSeoSourceKeys,
  metaLengthZone,
  stripHtmlToText,
  truncateForMeta,
} from "@/lib/seo-auto"

describe("stripHtmlToText", () => {
  it("убирает теги и схлопывает пробелы", () => {
    expect(stripHtmlToText("<p>Автобусные  туры</p><p>из Минска</p>")).toBe("Автобусные туры из Минска")
  })
  it("декодирует базовые entity", () => {
    expect(stripHtmlToText("Море&nbsp;&amp;&nbsp;солнце")).toBe("Море & солнце")
  })
  it("пустая строка — пустая строка", () => {
    expect(stripHtmlToText("")).toBe("")
  })
})

describe("truncateForMeta", () => {
  it("короткий текст не трогает", () => {
    expect(truncateForMeta("Короткий текст", 60)).toBe("Короткий текст")
  })
  it("режет по границе слова с многоточием и укладывается в лимит", () => {
    const out = truncateForMeta("Автобусные туры из Минска к морю без ночных переездов", 30)
    expect(out.length).toBeLessThanOrEqual(30)
    expect(out.endsWith("…")).toBe(true)
    expect(out).not.toMatch(/\s…$/)
  })
})

describe("buildAutoTitle", () => {
  it("добавляет бренд-суффикс", () => {
    expect(buildAutoTitle("Горящие туры")).toBe("Горящие туры — БасТур")
  })
  it("сохраняет бренд при длинном заголовке и укладывается в 60", () => {
    const long = "Автобусные туры из Минска к морю в Болгарию и Грецию без пересадок летом"
    const out = buildAutoTitle(long)
    expect(out.length).toBeLessThanOrEqual(60)
    expect(out.endsWith("— БасТур")).toBe(true)
  })
  it("пустой источник — пустая строка (авто недоступно)", () => {
    expect(buildAutoTitle("")).toBe("")
  })
  it("чистит HTML из shortcode-заголовка", () => {
    expect(buildAutoTitle("<strong>Египет</strong>")).toBe("Египет — БасТур")
  })
})

describe("buildAutoDescription", () => {
  it("режет интро до 160 по слову", () => {
    const intro = `<p>${"Отдых на море ".repeat(30)}</p>`
    const out = buildAutoDescription(intro)
    expect(out.length).toBeLessThanOrEqual(160)
    expect(out.endsWith("…")).toBe(true)
  })
})

describe("deriveSeoSourceKeys", () => {
  const groups = [
    {
      heading: "SEO и мета",
      fields: [{ key: "hot.metaTitle" }, { key: "hot.metaDescription" }],
    },
    {
      heading: "Шапка страницы",
      fields: [{ key: "hot.h1" }, { key: "hot.intro" }],
    },
  ]
  it("находит h1 и intro, пропуская SEO-группу", () => {
    expect(deriveSeoSourceKeys(groups)).toEqual({ titleKey: "hot.h1", descriptionKey: "hot.intro" })
  })
  it("не принимает meta*/seo* поля за источники", () => {
    const only = [{ heading: "SEO и мета", fields: [{ key: "p.metaTitle" }] }]
    expect(deriveSeoSourceKeys(only)).toEqual({ titleKey: undefined, descriptionKey: undefined })
  })
  it("fallback на .title/.subtitle при отсутствии h1/intro", () => {
    const alt = [
      { heading: "Блок", fields: [{ key: "page.title" }, { key: "page.subtitle" }] },
    ]
    expect(deriveSeoSourceKeys(alt)).toEqual({ titleKey: "page.title", descriptionKey: "page.subtitle" })
  })
})

describe("metaLengthZone", () => {
  it("зоны длины: ok / warn / over", () => {
    expect(metaLengthZone(30, 60)).toBe("ok")
    expect(metaLengthZone(58, 60)).toBe("warn")
    expect(metaLengthZone(61, 60)).toBe("over")
  })
})
