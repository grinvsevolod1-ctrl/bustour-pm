#!/usr/bin/env node
/**
 * Шаг деплоя: самопроверка интеграций и «дозаполнение» того, что можно
 * вычислить автоматически. Запускается после sealed-env apply и npm ci.
 *
 *  - Telegram: если задан TELEGRAM_BOT_TOKEN, а TELEGRAM_CHAT_ID нет — ищем
 *    чат через getUpdates (владелец должен один раз написать боту /start или
 *    добавить его в группу), записываем chat_id в .env и шлём подтверждение.
 *  - SMTP: если задан SMTP_HOST/SMTP_USER/SMTP_PASS — проверяем логин на
 *    почтовом сервере (nodemailer verify), чтобы ошибка была видна в логе
 *    деплоя, а не в момент первой заявки.
 *  - U-ON: только факт наличия ключа (у API нет безопасного «ping»).
 *
 * Никогда не печатает значения секретов — только имена и статусы.
 * Никогда не валит деплой: любые ошибки — предупреждения.
 */
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import process from "node:process"
import { describeChanges, parseEnvText, upsertEnvFile } from "./lib/env-file.mjs"

const TAG = "[integrations]"
const log = (...a) => console.log(TAG, ...a)
const warn = (...a) => console.warn(TAG, "ВНИМАНИЕ:", ...a)
const HTTP_TIMEOUT_MS = 10_000

function loadEnv(appDir) {
  const merged = {}
  for (const file of [".env", ".env.local"]) {
    const abs = path.join(appDir, file)
    if (existsSync(abs)) Object.assign(merged, parseEnvText(readFileSync(abs, "utf8")))
  }
  // Переменные процесса (deploy.sh уже сделал `. ./.env`) имеют приоритет.
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined) merged[k] = v
  return merged
}

/** Собирает уникальные чаты из апдейтов Telegram (личные, группы, каналы). */
export function extractChats(updates) {
  const chats = new Map()
  for (const u of updates) {
    const chat =
      u.message?.chat ?? u.edited_message?.chat ?? u.channel_post?.chat ?? u.my_chat_member?.chat ?? null
    if (!chat) continue
    const title = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(" ") || chat.username || ""
    chats.set(chat.id, { id: chat.id, type: chat.type, title, updateId: u.update_id })
  }
  return [...chats.values()].sort((a, b) => b.updateId - a.updateId)
}

async function tg(token, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.ok) throw new Error(json.description || `HTTP ${res.status}`)
  return json.result
}

async function checkTelegram(env, envFile, siteUrl) {
  const token = env.TELEGRAM_BOT_TOKEN?.trim()
  if (!token) {
    log("Telegram: TELEGRAM_BOT_TOKEN не задан — канал выключен")
    return
  }
  let me
  try {
    me = await tg(token, "getMe")
  } catch (err) {
    warn(`Telegram: токен не принят API (${err.message})`)
    return
  }
  const chatId = env.TELEGRAM_CHAT_ID?.trim()
  if (chatId) {
    log(`Telegram: бот @${me.username}, TELEGRAM_CHAT_ID задан — ок`)
    return
  }
  let chats
  try {
    chats = extractChats(await tg(token, "getUpdates", { limit: 100, timeout: 0 }))
  } catch (err) {
    warn(`Telegram: getUpdates не удался (${err.message}); chat_id можно указать в админке → Настройки → Уведомления`)
    return
  }
  if (!chats.length) {
    warn(
      `Telegram: бот @${me.username} работает, но ему ещё никто не писал. ` +
        `Откройте t.me/${me.username}, нажмите Start (или добавьте бота в группу) — chat_id подставится ` +
        "при следующем деплое. Либо укажите его в админке → Настройки → Уведомления.",
    )
    return
  }
  const chosen = chats[0]
  const changes = upsertEnvFile(envFile, { TELEGRAM_CHAT_ID: String(chosen.id) })
  log(
    `Telegram: найден чат «${chosen.title}» (${chosen.type}) → ${describeChanges(changes)}` +
      (chats.length > 1 ? `; ещё кандидаты: ${chats.slice(1).map((c) => `«${c.title}»`).join(", ")}` : ""),
  )
  try {
    await tg(token, "sendMessage", {
      chat_id: chosen.id,
      text: `Бот подключён к сайту ${siteUrl}. Сюда будут приходить заявки с форм сайта.`,
    })
  } catch (err) {
    warn(`Telegram: подтверждение в чат не отправилось (${err.message})`)
  }
}

async function checkSmtp(env) {
  const host = env.SMTP_HOST?.trim()
  const user = env.SMTP_USER?.trim()
  const pass = env.SMTP_PASS
  if (!host || !user || !pass) {
    log(
      env.RESEND_API_KEY
        ? "SMTP не настроен — почта уходит через Resend"
        : "E-mail: ни SMTP_HOST/SMTP_USER/SMTP_PASS, ни RESEND_API_KEY не заданы — канал выключен",
    )
    return
  }
  const port = Number.parseInt(env.SMTP_PORT ?? "", 10) || 465
  const secureRaw = env.SMTP_SECURE?.trim().toLowerCase()
  const secure = secureRaw ? !["0", "false", "no"].includes(secureRaw) : port === 465
  let nodemailer
  try {
    nodemailer = await import("nodemailer")
  } catch {
    warn("SMTP: пакет nodemailer не установлен — проверка пропущена (npm ci ещё не выполнялся?)")
    return
  }
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: HTTP_TIMEOUT_MS,
    greetingTimeout: HTTP_TIMEOUT_MS,
    socketTimeout: HTTP_TIMEOUT_MS,
  })
  try {
    await transporter.verify()
    log(`SMTP: ${host}:${port} (${secure ? "SSL/TLS" : "STARTTLS"}), логин ${user} — ок`)
  } catch (err) {
    warn(`SMTP: ${host}:${port} не принял логин ${user}: ${err.message}`)
  } finally {
    transporter.close()
  }
}

/**
 * Безопасная проверка ключа U-ON: GET-справочник валют ничего не меняет в CRM.
 * 200 — ключ рабочий; 403 — ключ неверный; 406 — ключ верный, но API
 * не включён в самой CRM (Настройки → Интеграции → API, разрешить GET/POST).
 */
async function checkUon(env) {
  const key = env.U_ON_API_KEY?.trim()
  if (!key) {
    log("U-ON CRM: U_ON_API_KEY не задан — выключено")
    return
  }
  try {
    const res = await fetch(`https://api.u-on.ru/${encodeURIComponent(key)}/currency.json`, {
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    })
    if (res.ok) log("U-ON CRM: ключ принят, API активен — заявки уходят в CRM")
    else if (res.status === 406)
      warn("U-ON CRM: ключ верный, но API выключен в CRM — включите в U-ON: Настройки → Интеграции → API (GET и POST)")
    else if (res.status === 403) warn("U-ON CRM: API отвечает «API key is wrong» — проверьте U_ON_API_KEY")
    else warn(`U-ON CRM: неожиданный ответ HTTP ${res.status}`)
  } catch (err) {
    warn(`U-ON CRM: API недоступен (${err.message})`)
  }
}

async function main() {
  const appDir = process.cwd()
  const envFile = path.join(appDir, ".env")
  const env = loadEnv(appDir)
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || "bus-tour.by"
  await checkTelegram(env, envFile, siteUrl)
  await checkSmtp(env)
  await checkUon(env)
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname
if (invokedDirectly) {
  main().catch((err) => {
    warn(`неожиданная ошибка: ${err instanceof Error ? err.message : String(err)}`)
  })
}
