import "server-only"

import { createTransport } from "nodemailer"
import { loadNotifyConfig, readSmtpConfig } from "@/lib/notify"
import { getCaptchaWiringStatus } from "@/lib/recaptcha"
import { getBustourDeployEnv } from "@/lib/deploy-env"

/** Внешние проверки идут параллельно; одна зависшая не должна держать страницу настроек. */
const CHECK_TIMEOUT_MS = 6_000

export type CheckTone = "ok" | "warn" | "off" | "error"

/**
 * Снимок состояния интеграций для админки. В объекте НЕТ секретов: только
 * факты «задано / не задано», имена хостов и ящиков, человекочитаемые статусы.
 */
export type IntegrationsStatus = {
  checkedAt: string
  email: {
    tone: CheckTone
    enabled: boolean
    transport: "smtp" | "resend" | "none"
    host: string | null
    user: string | null
    from: string
    to: string[]
    summary: string
  }
  telegram: {
    tone: CheckTone
    enabled: boolean
    tokenSet: boolean
    bot: string | null
    chatId: string | null
    chatIdSource: "settings" | "env" | null
    chats: { id: number; type: string; title: string }[]
    summary: string
  }
  crm: {
    tone: CheckTone
    keySet: boolean
    summary: string
  }
  captcha: {
    tone: CheckTone
    /** Формы на сайте реально отправляются (капча настроена или байпас на dev). */
    formsWork: boolean
    summary: string
  }
}

const TIMEOUT_TEXT = `нет ответа за ${CHECK_TIMEOUT_MS / 1000} с`

/** Человекочитаемая причина: таймауты fetch/сокета приходят по-английски и в разных формулировках. */
function describeError(err: unknown): string {
  const e = err as { name?: string; code?: string; message?: string }
  if (e?.name === "TimeoutError" || e?.name === "AbortError" || e?.code === "ETIMEDOUT" || /timeout|aborted/i.test(e?.message ?? "")) {
    return TIMEOUT_TEXT
  }
  return e?.message || String(err)
}

async function withTimeout<T, F>(promise: Promise<T>, fallback: (reason: string) => F): Promise<T | F> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<F>((resolve) => {
    timer = setTimeout(() => resolve(fallback(TIMEOUT_TEXT)), CHECK_TIMEOUT_MS)
  })
  try {
    return await Promise.race([promise.catch((err: unknown) => fallback(describeError(err))), timeout])
  } finally {
    clearTimeout(timer)
  }
}

async function checkEmail(): Promise<IntegrationsStatus["email"]> {
  const config = await loadNotifyConfig()
  const smtp = readSmtpConfig()
  const resendKey = process.env.RESEND_API_KEY?.trim()
  const base = {
    enabled: config.emailEnabled,
    from: config.emailFrom,
    to: config.emailTo,
    host: smtp?.host ?? null,
    user: smtp?.user ?? null,
  }

  if (!config.emailEnabled) {
    return { ...base, tone: "off", transport: smtp ? "smtp" : resendKey ? "resend" : "none", summary: "Выключено в настройках" }
  }
  if (!smtp && !resendKey) {
    return { ...base, tone: "error", transport: "none", summary: "Не настроен ни SMTP, ни Resend — письма не уходят" }
  }
  if (!smtp) {
    return { ...base, tone: "ok", transport: "resend", summary: "Через Resend" }
  }

  // verify() делает полное соединение + AUTH LOGIN и сразу закрывает — письмо не отправляется.
  const transporter = createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
    connectionTimeout: CHECK_TIMEOUT_MS,
    greetingTimeout: CHECK_TIMEOUT_MS,
    socketTimeout: CHECK_TIMEOUT_MS,
  })
  const verified = await withTimeout(
    transporter.verify().then(() => ({ ok: true as const })),
    (reason) => ({ ok: false as const, error: reason }),
  )
  transporter.close()

  if (!verified.ok) {
    return { ...base, tone: "error", transport: "smtp", summary: `SMTP ${smtp.host}:${smtp.port} — ${verified.error}` }
  }
  const fromMatchesUser = config.emailFrom.toLowerCase().includes(smtp.user.toLowerCase())
  if (!fromMatchesUser) {
    return {
      ...base,
      tone: "warn",
      transport: "smtp",
      summary: `Логин на ${smtp.host} успешен, но адрес отправителя не совпадает с ящиком ${smtp.user} — сервер может отклонять письма`,
    }
  }
  return { ...base, tone: "ok", transport: "smtp", summary: `SMTP ${smtp.host}:${smtp.port}, логин успешен` }
}

type TgChat = { id: number; type: string; title?: string; first_name?: string; last_name?: string; username?: string }
type TgUpdate = {
  message?: { chat: TgChat }
  edited_message?: { chat: TgChat }
  channel_post?: { chat: TgChat }
  my_chat_member?: { chat: TgChat }
}

async function tg<T>(token: string, method: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
  })
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: T; description?: string }
  if (!res.ok || !json.ok) throw new Error(json.description || `HTTP ${res.status}`)
  return json.result as T
}

async function checkTelegram(): Promise<IntegrationsStatus["telegram"]> {
  const config = await loadNotifyConfig()
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  const settingsChatId = await import("@/lib/cms")
    .then(({ getSettings }) => getSettings())
    .then((s) => s["notify.telegramChatId"]?.trim() || "")
    .catch(() => "")
  const chatId = config.telegramChatId || null
  const chatIdSource: "settings" | "env" | null = chatId ? (settingsChatId ? "settings" : "env") : null
  const base: Omit<IntegrationsStatus["telegram"], "tone" | "summary"> = {
    enabled: config.telegramEnabled,
    tokenSet: Boolean(token),
    chatId,
    chatIdSource,
    bot: null,
    chats: [],
  }

  if (!token) return { ...base, tone: "error", summary: "TELEGRAM_BOT_TOKEN не задан на сервере" }
  if (!config.telegramEnabled) return { ...base, tone: "off", summary: "Выключено в настройках" }

  const probe = await withTimeout(
    (async () => {
      const me = await tg<{ username: string }>(token, "getMe")
      const updates = await tg<TgUpdate[]>(token, "getUpdates", { limit: 100, timeout: 0 })
      const chats = new Map<number, { id: number; type: string; title: string }>()
      for (const u of updates) {
        const chat = u.message?.chat ?? u.edited_message?.chat ?? u.channel_post?.chat ?? u.my_chat_member?.chat
        if (!chat) continue
        const title = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(" ") || chat.username || ""
        chats.set(chat.id, { id: chat.id, type: chat.type, title })
      }
      // getChat ничего не отправляет, но подтверждает, что бот видит именно этот чат.
      const target = chatId
        ? await tg<TgChat>(token, "getChat", { chat_id: chatId })
            .then((chat) => ({ ok: true as const, chat }))
            .catch((err: unknown) => ({ ok: false as const, error: describeError(err) }))
        : null
      return { ok: true as const, bot: `@${me.username}`, chats: [...chats.values()], target }
    })(),
    (reason) => ({ ok: false as const, error: reason }),
  )

  if (!probe.ok) return { ...base, tone: "error", summary: `Telegram API — ${probe.error}` }
  const withBot = { ...base, bot: probe.bot, chats: probe.chats }
  if (!chatId || !probe.target) {
    return {
      ...withBot,
      tone: "warn",
      summary: probe.chats.length
        ? "Бот работает, но chat_id не выбран — укажите ID из списка ниже"
        : `Бот работает, но ему ещё никто не писал — откройте t.me/${probe.bot.slice(1)}, нажмите Start и обновите страницу`,
    }
  }
  if (!probe.target.ok) {
    return {
      ...withBot,
      tone: "error",
      summary: `Бот ${probe.bot} не видит чат ${chatId} (${probe.target.error}) — проверьте ID или добавьте бота в чат`,
    }
  }
  const chat = probe.target.chat
  const title = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(" ") || chat.username || chatId
  return { ...withBot, tone: "ok", summary: `Бот ${probe.bot}, уведомления идут в «${title}» (${chat.type})` }
}

/**
 * GET-справочник валют ничего не меняет в CRM. 406 — ключ верный, но API
 * выключен в самой CRM; 403 — ключ неверный.
 */
async function checkCrm(): Promise<IntegrationsStatus["crm"]> {
  const key = process.env.U_ON_API_KEY?.trim()
  if (!key) return { tone: "off", keySet: false, summary: "U_ON_API_KEY не задан — заявки в CRM не отправляются" }
  const probe = await withTimeout(
    fetch(`https://api.u-on.ru/${encodeURIComponent(key)}/currency.json`, {
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    }).then((r) => ({ ok: true as const, status: r.status })),
    (reason) => ({ ok: false as const, error: reason }),
  )
  if (!probe.ok) return { tone: "error", keySet: true, summary: `api.u-on.ru недоступен — ${probe.error}` }
  if (probe.status === 200) return { tone: "ok", keySet: true, summary: "Ключ принят, API активен — заявки уходят в CRM" }
  if (probe.status === 406) {
    return {
      tone: "warn",
      keySet: true,
      summary: "Ключ верный, но API выключен в самой CRM: U-ON → Настройки → Интеграции → API, включить GET и POST",
    }
  }
  if (probe.status === 403) return { tone: "error", keySet: true, summary: "U-ON не принял ключ (API key is wrong)" }
  return { tone: "error", keySet: true, summary: `Неожиданный ответ U-ON: HTTP ${probe.status}` }
}

function checkCaptcha(): IntegrationsStatus["captcha"] {
  const wiring = getCaptchaWiringStatus()
  const production = getBustourDeployEnv() === "production"
  if (wiring.siteKeySet && wiring.secretSet) return { tone: "ok", formsWork: true, summary: "reCAPTCHA v3 настроена" }
  if (!production && wiring.bypassed) {
    return { tone: "warn", formsWork: true, summary: "Капча отключена на этом стенде (не production) — формы работают без проверки" }
  }
  return {
    tone: "error",
    formsWork: false,
    summary:
      "Ключи reCAPTCHA v3 не заданы — в production формы заявок и отзывов НЕ отправляются. Нужны NEXT_PUBLIC_RECAPTCHA_SITE_KEY и RECAPTCHA_SECRET_KEY",
  }
}

export async function getIntegrationsStatus(): Promise<IntegrationsStatus> {
  const [email, telegram, crm] = await Promise.all([checkEmail(), checkTelegram(), checkCrm()])
  return { checkedAt: new Date().toISOString(), email, telegram, crm, captcha: checkCaptcha() }
}
