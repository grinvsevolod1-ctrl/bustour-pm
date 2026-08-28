import { phoneCorrelationTag, type LeadData } from "@/lib/notify"

/**
 * Интеграция с CRM U-ON.Travel (api.u-on.ru).
 *
 * Отправка лида — метод POST /{key}/lead/create.json («Добавление обращения»).
 * Клиенту u-on обязательно хотя бы одно контактное поле (телефон / e-mail и т.д.),
 * поэтому сюда передаём ТОЛЬКО реальные заявки с валидным телефоном — отзывы
 * (у которых в notify передаётся хеш вместо телефона) в CRM не попадают.
 *
 * Feature-flag: если U_ON_API_KEY не задан — интеграция молча выключена
 * (заявка всё равно сохранена в БД и ушла в Telegram/e-mail). Это позволяет
 * влить код в main до того, как заказчик выдаст API-ключ (п.3.3 договора).
 */

/** Жёсткий таймаут исходящего запроса — зависший CRM не должен блокировать ответ. */
const UON_TIMEOUT_MS = 5_000

const UON_BASE = "https://api.u-on.ru"

function typeLabelRu(type: LeadData["type"]): string {
  if (type === "booking") return "Бронирование тура"
  if (type === "callback") return "Заказ звонка"
  if (type === "rentbus") return "Аренда автобуса"
  return "Обращение с сайта"
}

/**
 * Разбивает «Имя Фамилия» на u_name / u_surname. Если пробелов нет —
 * всё уходит в имя. CRM не требует фамилию, это лишь для удобства менеджеров.
 */
function splitName(full: string): { name: string; surname: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { name: full.trim(), surname: "" }
  return { name: parts[0], surname: parts.slice(1).join(" ") }
}

/** Собирает примечание к лиду из тура и сообщения клиента. */
function buildNote(data: LeadData): string {
  return [
    `Тип заявки: ${typeLabelRu(data.type)}`,
    data.tour ? `Тур: ${data.tour}` : "",
    data.message ? `Сообщение: ${data.message}` : "",
    "Источник: сайт bus-tour.by",
  ]
    .filter(Boolean)
    .join("\n")
}

/**
 * Отправляет лид в U-ON. Никогда не бросает — доставка best-effort.
 * Возвращает true при подтверждённом HTTP 200 от API.
 */
export async function sendLeadToUon(data: LeadData): Promise<boolean> {
  const key = process.env.U_ON_API_KEY?.trim()
  const correlationId = data.correlationId || phoneCorrelationTag(data.phone)

  if (!key) {
    // Ключа нет — интеграция выключена. Пишем в лог на уровне debug-инфо,
    // чтобы не засорять прод, но было видно при диагностике.
    console.info("[u-on] disabled (U_ON_API_KEY not set) — lead cid=%s not sent to CRM", correlationId)
    return false
  }

  const { name, surname } = splitName(data.name)
  // U-ON принимает POST form-urlencoded. Даты в формате Y-m-d H:i:s.
  const params = new URLSearchParams()
  if (name) params.set("u_name", name)
  if (surname) params.set("u_surname", surname)
  if (data.phone) params.set("u_phone", data.phone)
  if (data.email) params.set("u_email", data.email)
  params.set("note", buildNote(data))
  params.set("source", "Сайт bus-tour.by")

  try {
    const resp = await fetch(`${UON_BASE}/${encodeURIComponent(key)}/lead/create.json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: AbortSignal.timeout(UON_TIMEOUT_MS),
    })
    if (!resp.ok) {
      console.error("[u-on] lead cid=%s create failed: HTTP %d", correlationId, resp.status)
      return false
    }
    // U-ON отдаёт JSON с полем result (1 — успех). Тело читаем best-effort.
    const bodyText = await resp.text().catch(() => "")
    console.info("[u-on] lead cid=%s sent to CRM (HTTP %d)", correlationId, resp.status)
    // Не парсим строго: даже нестандартный ответ при HTTP 200 считаем доставкой,
    // детали — в bodyText для диагностики.
    if (bodyText && /"result"\s*:\s*0/.test(bodyText)) {
      console.error("[u-on] lead cid=%s CRM returned result=0: %s", correlationId, bodyText.slice(0, 200))
      return false
    }
    return true
  } catch (err) {
    console.error("[u-on] lead cid=%s create error: %s", correlationId, (err as Error).message)
    return false
  }
}
