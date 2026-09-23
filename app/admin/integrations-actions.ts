"use server"

import { withAdminAction } from "@/lib/admin-action"
import { sendTestNotification } from "@/lib/notify"

export type TestNotificationResult = { ok: true } | { error: string }

/**
 * Тестовое уведомление тем же путём, что и реальная заявка. Требует право
 * manage_settings и пишется в аудит — чтобы было видно, кто и когда дёргал.
 */
export async function sendTestNotificationAction(channel: "email" | "telegram"): Promise<TestNotificationResult> {
  if (channel !== "email" && channel !== "telegram") return { error: "Неизвестный канал" }
  return withAdminAction<TestNotificationResult>(
    { capability: "manage_settings", errorMessage: "Не удалось отправить тестовое уведомление" },
    async (admin) => {
      const result = await sendTestNotification(channel, admin.username)
      if (!result.ok) return { result: { error: result.error } }
      return {
        audit: {
          action: "notify_test",
          entityType: "settings",
          entityId: channel,
          summary: `Тестовое уведомление: ${channel === "email" ? "e-mail" : "Telegram"}`,
        },
      }
    },
  )
}
