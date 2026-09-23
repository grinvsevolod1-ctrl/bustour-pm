import { describe, expect, it } from "vitest"
import {
  MANAGED_BLOCK_MARKER,
  formatEnvValue,
  parseEnvText,
  unquoteEnvValue,
  upsertEnvText,
} from "../scripts/lib/env-file.mjs"

describe("formatEnvValue", () => {
  it("оставляет простые значения без кавычек", () => {
    expect(formatEnvValue("smtp.hoster.by")).toBe("smtp.hoster.by")
    expect(formatEnvValue("123456:AAbb-cc_dd")).toBe("123456:AAbb-cc_dd")
    expect(formatEnvValue("465")).toBe("465")
  })

  it("оборачивает в одинарные кавычки всё, что опасно для bash", () => {
    expect(formatEnvValue("12Booking34!")).toBe("'12Booking34!'")
    expect(formatEnvValue('"Заявка с сайта" <booking@bus-tour.by>')).toBe(`'"Заявка с сайта" <booking@bus-tour.by>'`)
    expect(formatEnvValue("a b")).toBe("'a b'")
    expect(formatEnvValue("$HOME")).toBe("'$HOME'")
  })

  it("экранирует апостроф и обратно читается unquoteEnvValue", () => {
    const raw = "it's"
    const formatted = formatEnvValue(raw)
    expect(formatted).toBe(`'it'\\''s'`)
    expect(unquoteEnvValue(formatted)).toBe(raw)
  })
})

describe("parseEnvText", () => {
  it("читает пары, снимает кавычки, пропускает комментарии", () => {
    const parsed = parseEnvText(
      ["# comment", "A=1", "B='two words'", 'C="quoted"', "export D=4", "  # E=hidden", "BAD LINE", ""].join("\n"),
    )
    expect(parsed).toEqual({ A: "1", B: "two words", C: "quoted", D: "4" })
  })
})

describe("upsertEnvText", () => {
  const base = ["# --- Домен ---", "NEXT_PUBLIC_SITE_URL=https://bus-tour.by", "", "# TELEGRAM_BOT_TOKEN=", "PORT=3000", ""].join(
    "\n",
  )

  it("добавляет отсутствующие ключи одним блоком под маркером и не трогает остальное", () => {
    const { text, changes } = upsertEnvText(base, { TELEGRAM_BOT_TOKEN: "1:abc", SMTP_PASS: "p w!" })
    expect(text.startsWith(base.trimEnd())).toBe(true)
    expect(text).toContain(`${MANAGED_BLOCK_MARKER}\nTELEGRAM_BOT_TOKEN=1:abc\nSMTP_PASS='p w!'\n`)
    expect(text.endsWith("\n")).toBe(true)
    // Закомментированная строка не считается активной и остаётся как была
    expect(text).toContain("# TELEGRAM_BOT_TOKEN=\n")
    expect(changes).toEqual([
      { key: "TELEGRAM_BOT_TOKEN", status: "added" },
      { key: "SMTP_PASS", status: "added" },
    ])
  })

  it("обновляет существующий ключ на месте и сообщает unchanged при совпадении", () => {
    const { text, changes } = upsertEnvText(base, { PORT: "3001", NEXT_PUBLIC_SITE_URL: "https://bus-tour.by" })
    expect(text).toContain("\nPORT=3001\n")
    expect(text).not.toContain(MANAGED_BLOCK_MARKER)
    expect(changes).toEqual([
      { key: "PORT", status: "updated" },
      { key: "NEXT_PUBLIC_SITE_URL", status: "unchanged" },
    ])
  })

  it("идемпотентен: повторное применение не меняет текст и не дублирует маркер", () => {
    const first = upsertEnvText(base, { SMTP_HOST: "smtp.hoster.by" }).text
    const second = upsertEnvText(first, { SMTP_HOST: "smtp.hoster.by", SMTP_PORT: "465" })
    expect(second.text.split(MANAGED_BLOCK_MARKER).length).toBe(2)
    expect(upsertEnvText(second.text, { SMTP_HOST: "smtp.hoster.by", SMTP_PORT: "465" }).text).toBe(second.text)
  })

  it("обновляет все активные дубликаты ключа (bash и pm2 берут последнее вхождение)", () => {
    const { text } = upsertEnvText("A=1\nA=2\n", { A: "3" })
    expect(text).toBe("A=3\nA=3\n")
  })

  it("сохраняет значение в кавычках при сравнении", () => {
    const { changes } = upsertEnvText("FROM='\"Имя\" <a@b.by>'\n", { FROM: '"Имя" <a@b.by>' })
    expect(changes).toEqual([{ key: "FROM", status: "unchanged" }])
  })
})
