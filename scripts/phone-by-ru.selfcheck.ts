import assert from "node:assert/strict"
import { formatPhoneIfComplete, isSupportedPhone, sanitizePhoneTyping, validateLead } from "../lib/lead"

assert.equal(formatPhoneIfComplete("440000000"), "+375 44 000 00 00")
assert.equal(formatPhoneIfComplete("80291234567"), "+375 29 123 45 67")
assert.equal(formatPhoneIfComplete("89161234567"), "+7 916 123 45 67")
// Пограничный ввод больше не превращается в несуществующий номер:
// раньше "8044555555" форматировалось в мусор "+375 804 455 5555" (13 цифр).
assert.notEqual(formatPhoneIfComplete("8044555555"), "+375 804 455 5555")
// Инвариант: если форматтер ИЗМЕНИЛ ввод (произошла трансформация), результат
// ОБЯЗАН быть поддерживаемым BY/RU номером — мусорная трансформация недопустима.
for (const raw of ["8044555555", "375 29 555", "+37529555555", "+375 29 555 5", "375445555555", "89161234567"]) {
  const out = formatPhoneIfComplete(raw)
  if (out !== raw.trim()) {
    assert.ok(isSupportedPhone(out), `formatted "${raw}" -> "${out}" must be a supported number`)
  }
}
assert.equal(sanitizePhoneTyping(""), "")
assert.equal(isSupportedPhone("+375 44 000 00 00"), true)
assert.equal(isSupportedPhone("+7 916 123-45-67"), true)
assert.equal(isSupportedPhone("+48 123 456 789"), false)
assert.ok(validateLead({ name: "Иван", phone: "+48 123 456 789", type: "contact" }).phone)

console.log("phone-by-ru.selfcheck: ok")
