/**
 * #51 → упрощение по запросу владельца: модалка «Заказать автобус» содержит
 * только имя, телефон, комментарий, согласие на обработку ПД и карточку
 * заказываемого автобуса. Никаких полей поездки (откуда/куда/дата/пассажиры).
 */
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const modal = fs.readFileSync(
  path.join(import.meta.dirname, "../components/site/modals/modal-bus-order.tsx"),
  "utf8",
)

// Обязательный состав формы
assert.ok(modal.includes('label="Имя:"'), "name field")
assert.ok(modal.includes('label="Телефон:"'), "phone field")
assert.ok(modal.includes('label="Комментарий к заявке:"'), "comment field")
assert.ok(modal.includes("обработку"), "consent checkbox text")
assert.ok(modal.includes('type="checkbox"'), "consent checkbox input")
assert.ok(modal.includes("tour: busTitle"), "bus title in payload")
assert.ok(modal.includes("busTitle"), "bus card shown in modal")

// Поля поездки удалены — не должны вернуться
assert.ok(!modal.includes('label="Откуда:"'), "no from field")
assert.ok(!modal.includes('label="Куда:"'), "no to field")
assert.ok(!modal.includes('label="E-mail:"'), "no email field")
assert.ok(!modal.includes('label="Количество пассажиров:"'), "no passengers field")
assert.ok(!modal.includes('label="Дата отправления:"'), "no departure field")

const btn = fs.readFileSync(
  path.join(import.meta.dirname, "../components/site/bus-order-button.tsx"),
  "utf8",
)
assert.ok(btn.includes("ModalBusOrder"), "wired")
assert.ok(btn.includes("busTitle={busTitle}"), "passes bus title")

console.log("bus-order-mobile.selfcheck: ok")
