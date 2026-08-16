import { describe, it, expect } from "vitest"
import { GLOBAL_SETTINGS_PREFIXES, isGlobalSettingsKey } from "@/lib/settings-scope"
import { roleHasCapability } from "@/lib/admin-roles"

// Ключевая защита saveSettingsAction: право на глобальные настройки выводится
// из САМИХ сохраняемых ключей (key-derived), а не из клиентского флага формы.
// Тест фиксирует семантику, чтобы регрессия не вернула дыру, когда менеджер
// мог подделать POST и записать site.* ключи.

describe("isGlobalSettingsKey", () => {
  it("глобальные пространства ключей распознаются", () => {
    expect(isGlobalSettingsKey("site.phone")).toBe(true)
    expect(isGlobalSettingsKey("analytics.gtmId")).toBe(true)
    expect(isGlobalSettingsKey("announcement.text")).toBe(true)
    expect(isGlobalSettingsKey("notify.email")).toBe(true)
    expect(isGlobalSettingsKey("social.links")).toBe(true)
  })

  it("страничные ключи глобальными не считаются", () => {
    expect(isGlobalSettingsKey("bustours.intro")).toBe(false)
    expect(isGlobalSettingsKey("memos.section.callus")).toBe(false)
    expect(isGlobalSettingsKey("contacts.metaTitle")).toBe(false)
    expect(isGlobalSettingsKey("home.hero.title")).toBe(false)
  })

  it("ключ без точки-префикса не совпадает по подстроке", () => {
    // "sitemap.foo" не должен ловиться префиксом "site." — префикс включает точку
    expect(isGlobalSettingsKey("sitemap.foo")).toBe(false)
    expect(isGlobalSettingsKey("socials.foo")).toBe(false)
  })

  it("список префиксов не пуст и каждый оканчивается точкой", () => {
    expect(GLOBAL_SETTINGS_PREFIXES.length).toBeGreaterThan(0)
    for (const prefix of GLOBAL_SETTINGS_PREFIXES) {
      expect(prefix.endsWith(".")).toBe(true)
    }
  })
})

describe("key-derived гейт: роли и manage_settings", () => {
  it("менеджер не имеет manage_settings — глобальные ключи для него отклоняются", () => {
    expect(roleHasCapability("manager", "manage_settings")).toBe(false)
  })

  it("superadmin имеет manage_settings", () => {
    expect(roleHasCapability("superadmin", "manage_settings")).toBe(true)
  })

  it("сценарий подделки: POST менеджера с site.* должен блокироваться", () => {
    const forgedKeys = ["bustours.intro", "site.phone"]
    const blocked =
      forgedKeys.some(isGlobalSettingsKey) && !roleHasCapability("manager", "manage_settings")
    expect(blocked).toBe(true)
  })

  it("сценарий нормы: страничные ключи менеджера проходят", () => {
    const pageKeys = ["bustours.intro", "memos.section.callus"]
    const blocked =
      pageKeys.some(isGlobalSettingsKey) && !roleHasCapability("manager", "manage_settings")
    expect(blocked).toBe(false)
  })
})
