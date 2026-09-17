import { describe, expect, it } from "vitest"
import {
  normalizeName,
  normalizeEmail,
  normalizeSingleLine,
  normalizeMultiline,
} from "@/lib/form-normalize"

describe("normalizeName", () => {
  it("приводит регистр каждого слова", () => {
    expect(normalizeName("иванов иван")).toBe("Иванов Иван")
  })
  it("чинит CAPS LOCK", () => {
    expect(normalizeName("ИВАНОВ")).toBe("Иванов")
  })
  it("капитализирует части через дефис", () => {
    expect(normalizeName("анна-мария")).toBe("Анна-Мария")
  })
  it("схлопывает пробелы и обрезает края", () => {
    expect(normalizeName("  пётр   петров  ")).toBe("Пётр Петров")
  })
  it("удаляет цифры и мусорные символы", () => {
    expect(normalizeName("иван123!@#")).toBe("Иван")
  })
  it("работает с латиницей", () => {
    expect(normalizeName("john DOE")).toBe("John Doe")
  })
})

describe("normalizeEmail", () => {
  it("нижний регистр без пробелов", () => {
    expect(normalizeEmail("  Ivan@Mail.RU ")).toBe("ivan@mail.ru")
  })
  it("вырезает внутренние пробелы", () => {
    expect(normalizeEmail("iv an@ma il.ru")).toBe("ivan@mail.ru")
  })
})

describe("normalizeSingleLine", () => {
  it("схлопывает пробелы и обрезает", () => {
    expect(normalizeSingleLine("  18   сентября  ")).toBe("18 сентября")
  })
})

describe("normalizeMultiline", () => {
  it("ограничивает пустые строки и чистит края", () => {
    expect(normalizeMultiline("Строка 1\n\n\n\nСтрока 2   ")).toBe("Строка 1\n\nСтрока 2")
  })
  it("срезает пробелы вокруг переносов", () => {
    expect(normalizeMultiline("a   \n   b")).toBe("a\nb")
  })
})
