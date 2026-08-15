import { describe, expect, it } from "vitest"
import { findOrphanMedia, isMediaUsed, type OrphanMediaCandidate } from "../lib/orphan-media-cleanup"

const DAY = 24 * 60 * 60 * 1000
const NOW = 1_800_000_000_000

function candidate(overrides: Partial<OrphanMediaCandidate>): OrphanMediaCandidate {
  return {
    id: "m1",
    url: "/uploads/photo.webp",
    name: "photo.webp",
    status: "ready",
    createdAt: NOW - 60 * DAY,
    ...overrides,
  }
}

describe("isMediaUsed", () => {
  it("находит использование по точному url", () => {
    expect(isMediaUsed(candidate({}), '{"image":"/uploads/photo.webp"}')).toBe(true)
  })

  it("находит использование по пути, когда в БД абсолютный url", () => {
    const c = candidate({ url: "https://bus-tour.by/uploads/photo.webp" })
    expect(isMediaUsed(c, 'src="/uploads/photo.webp"')).toBe(true)
  })

  it("находит использование по id файла", () => {
    expect(isMediaUsed(candidate({ id: "abc-123" }), '{"mediaId":"abc-123"}')).toBe(true)
  })

  it("не считает используемым отсутствующий в корпусе файл", () => {
    expect(isMediaUsed(candidate({}), "совсем другой контент")).toBe(false)
  })

  it("файл без url не трогаем (считаем используемым)", () => {
    expect(isMediaUsed(candidate({ url: "" }), "")).toBe(true)
  })
})

describe("findOrphanMedia", () => {
  it("находит сироту и пропускает свежие и обрабатываемые файлы", () => {
    const files = [
      candidate({ id: "orphan", url: "/uploads/orphan.webp" }),
      candidate({ id: "used", url: "/uploads/used.webp" }),
      candidate({ id: "fresh", url: "/uploads/fresh.webp", createdAt: NOW - DAY }),
      candidate({ id: "processing", url: "/uploads/proc.webp", status: "processing" }),
    ]
    const report = findOrphanMedia(files, 'img="/uploads/used.webp"', { now: NOW })
    expect(report.orphans.map((o) => o.id)).toEqual(["orphan"])
    expect(report.skippedTooRecent).toBe(1)
    expect(report.skippedProcessing).toBe(1)
    expect(report.totalChecked).toBe(4)
  })

  it("уважает кастомный minAgeMs", () => {
    const files = [candidate({ id: "young", url: "/uploads/young.webp", createdAt: NOW - 2 * DAY })]
    const strict = findOrphanMedia(files, "", { now: NOW, minAgeMs: 7 * DAY })
    expect(strict.orphans).toHaveLength(0)
    const lax = findOrphanMedia(files, "", { now: NOW, minAgeMs: DAY })
    expect(lax.orphans.map((o) => o.id)).toEqual(["young"])
  })
})
