// CLI восстановления доступа в админку — на случай, когда единственный админ
// забыл пароль и не может войти в панель (в UI сброс делает другой админ, а
// здесь спасение «извне», по SSH на сервере).
//
// Запуск на сервере (из каталога проекта, с загруженными переменными .env):
//   set -a && source .env && set +a
//   npx tsx scripts/admin-password.ts <логин> <новый-пароль> [роль]
//
// Поведение:
//   • пользователь с таким логином есть  → сбрасываем ему пароль (и снова
//     активируем, если был скрыт). Роль не трогаем, если её не передали.
//   • пользователя нет                   → создаём нового (роль по умолчанию
//     superadmin, чтобы точно получить полный доступ).
//
// Любой сброс/создание отзывает все ранее выданные сессии (updateAdminUser
// поднимает sessionVersion), так что старые cookie перестанут работать.

import { createAdminUser, listAdmins, updateAdminUser } from "../lib/admins"
import { parseAdminRole } from "../lib/admin-roles"

async function main() {
  const [username, password, roleArg] = process.argv.slice(2)

  if (!username || !password) {
    console.error(
      "Использование: npx tsx scripts/admin-password.ts <логин> <новый-пароль> [роль]\n" +
        "Роли: superadmin | admin | manager (по умолчанию superadmin для нового пользователя).",
    )
    process.exit(1)
  }
  if (password.length < 6) {
    console.error("Пароль должен быть не короче 6 символов.")
    process.exit(1)
  }

  // includeInactive: чтобы найти и «оживить» скрытого (soft-deleted) админа.
  const admins = await listAdmins({ includeInactive: true })
  const existing = admins.find((a) => a.username === username.trim())

  if (existing) {
    const role = roleArg ? parseAdminRole(roleArg) : undefined
    await updateAdminUser(existing.id, { password, active: true, ...(role ? { role } : {}) })
    console.log(
      `Пароль пользователя «${username}» сброшен` +
        (existing.active ? "" : " (пользователь снова активирован)") +
        (role ? `, роль: ${role}` : `, роль без изменений: ${existing.role}`) +
        ". Все прежние сессии отозваны.",
    )
  } else {
    const role = parseAdminRole(roleArg || "superadmin")
    const created = await createAdminUser({ username: username.trim(), password, role })
    console.log(`Создан новый пользователь «${created.username}» с ролью ${created.role}.`)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error("Ошибка:", err instanceof Error ? err.message : err)
  process.exit(1)
})
