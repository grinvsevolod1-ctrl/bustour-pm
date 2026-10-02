/**
 * Hours/phones from CMS; tel: links on public contacts surfaces.
 * Run: npx tsx scripts/contacts-cms-tel.selfcheck.ts
 */
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { getDisplayPhones, telHref } from "../lib/contact-settings"

assert.equal(telHref("+375 (29) 621-44-77"), "tel:+375296214477")
assert.equal(telHref("79001234567"), "tel:79001234567")

const phones = getDisplayPhones({
  "site.phones": "+375 (29) 111-11-11\n+7 900 123-45-67",
} as Record<string, string>)
assert.equal(phones.length, 2)
assert.ok(phones.every((p) => p.href.startsWith("tel:")))

// Шапка — клиентский компонент без доступа к настройкам: часы и телефон ей
// передаёт серверный layout (так в клиентский бандл не попадает вся CMS).
const header = readFileSync(join(process.cwd(), "components/site/site-header.tsx"), "utf8")
assert.match(header, /hours: string/, "header receives hours via props")
assert.match(header, /primaryPhone\.href|getPrimaryPhone/)

const siteLayout = readFileSync(join(process.cwd(), "app/(site)/layout.tsx"), "utf8")
assert.match(siteLayout, /hours=\{settings\["site\.hours"\]/, "layout feeds header hours from CMS")
assert.match(siteLayout, /getPrimaryPhone\(settings\)/, "layout feeds header phone from CMS")

const contacts = readFileSync(join(process.cwd(), "app/(site)/contacts/page.tsx"), "utf8")
assert.match(contacts, /getDisplayPhones/)
assert.match(contacts, /site\.hoursFull|site\.hours/)
assert.match(contacts, /href=\{phone\.href\}/)

const footer = readFileSync(join(process.cwd(), "components/site/site-footer.tsx"), "utf8")
assert.match(footer, /getDisplayPhones/)

// Провайдер обратного звонка получает часы/телефон из layout (CMS), а сам
// диалог — отдельный ленивый чанк (callback-dialog.tsx) с теми же пропсами.
const callback = readFileSync(join(process.cwd(), "components/site/callback-modal.tsx"), "utf8")
assert.match(callback, /hours\?: string/, "callback provider receives hours via props")
assert.match(callback, /phone\?: DisplayPhone \| null/, "callback provider receives company phone via props")
assert.match(callback, /import\("\.\/callback-dialog"\)/, "callback dialog is a lazy chunk")
assert.match(siteLayout, /hours=\{officeHours\}/, "layout feeds callback hours from CMS")
assert.match(siteLayout, /getOfficeHoursLabel\(settings\)/, "callback hours come from CMS settings")

const callbackDialog = readFileSync(join(process.cwd(), "components/site/callback-dialog.tsx"), "utf8")
assert.match(callbackDialog, /\(\{hours\}\)/, "dialog copy renders hours from props")
assert.doesNotMatch(
  callbackDialog,
  /перезвоним в рабочее время \(10:00–18:00\)/,
  "no hardcoded office hours in callback copy",
)

console.log("contacts-cms-tel.selfcheck: ok")
