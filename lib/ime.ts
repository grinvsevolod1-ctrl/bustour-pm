import type React from "react"

/**
 * Enter во время композиции CJK-раскладок (и других IME) подтверждает
 * набранный слог, а не отправляет форму. Без этой проверки Enter-обработчики
 * срабатывали бы посреди ввода. keyCode 229 — Safari Desktop: его финальное
 * событие композиции ненадёжно, трактуем как «ещё набирает».
 */
export function isImeComposing(event: React.KeyboardEvent): boolean {
  return event.nativeEvent.isComposing || event.keyCode === 229
}
