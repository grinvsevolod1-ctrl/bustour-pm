// Единый модуль форматирования цен и дат для всего проекта.
// Почему: раньше formatPrice/formatMoney и date-форматтеры дублировались в
// tours-listing, tour-pricing-workspace, leads и audit — расхождение формата
// приводило к визуальной рассинхронизации. Держим один источник правды.

// Целое число с разделителями тысяч по-русски: 1200 -> "1 200".
export function formatPrice(value: number): string {
  return Math.round(value).toLocaleString("ru-RU")
}

// Цена с кодом/символом валюты: 1200, "BYN" -> "1 200 BYN".
export function formatMoney(value: number, currency: string): string {
  return `${formatPrice(value)} ${currency}`
}

// Дата+время (dd.MM.yyyy, HH:mm) из timestamp — для админ-таблиц (лиды).
export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Локализованное дата+время без жёсткого формата, с защитой от невалидного ts
// (используется в журнале аудита, где ts может прийти повреждённым).
export function formatDateTimeSafe(ts: number): string {
  try {
    return new Date(ts).toLocaleString("ru-RU")
  } catch {
    return String(ts)
  }
}
