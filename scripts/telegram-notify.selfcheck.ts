/**
 * Config + CLI contract for telegram-notify (send_notification drop-in).
 * Run: npx tsx scripts/telegram-notify.selfcheck.ts
 */
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

const root = process.cwd()
const script = join(root, "scripts", "telegram-notify.ts")
const mcpServer = join(root, "tools", "telegram-notifications-mcp", "server.mjs")
const mcpPkg = join(root, "tools", "telegram-notifications-mcp", "package.json")

assert.ok(existsSync(script), "scripts/telegram-notify.ts missing")

const src = readFileSync(script, "utf8")
assert.match(src, /--message/)
assert.match(src, /Notification queued/)

// MCP-сервер (tools/telegram-notifications-mcp) живёт вне репозитория —
// его никогда не было в git-истории, он устанавливается на сервере отдельно.
// Жёсткий assert на его наличие валил selfcheck в любом свежем клоне,
// поэтому контракт MCP проверяем только там, где каталог реально есть.
if (existsSync(mcpServer)) {
  assert.ok(existsSync(mcpPkg), "tools/telegram-notifications-mcp/package.json missing")
  const mcp = readFileSync(mcpServer, "utf8")
  assert.match(mcp, /send_notification/)
  assert.match(mcp, /Notification queued/)
  assert.match(mcp, /telegram-notifier\.env/)
} else {
  console.log("telegram-notify.selfcheck: tools/telegram-notifications-mcp отсутствует — MCP-проверки пропущены")
}

const dry = spawnSync(
  process.execPath,
  [
    join(root, "node_modules", "tsx", "dist", "cli.mjs"),
    "scripts/telegram-notify.ts",
    "--dry-run",
    "--title",
    "selfcheck",
    "--message",
    "ping",
  ],
  { cwd: root, encoding: "utf8", shell: false },
)
// fallback if tsx path differs
const dry2 =
  dry.status === 0
    ? dry
    : // shell нужен только на Windows (npx.cmd); на Linux shell:true с массивом args даёт DEP0190
      spawnSync(
        process.platform === "win32" ? "npx.cmd" : "npx",
        ["tsx", "scripts/telegram-notify.ts", "--dry-run", "--title", "selfcheck", "--message", "ping"],
        {
          cwd: root,
          encoding: "utf8",
          shell: process.platform === "win32",
        },
      )

assert.equal(dry2.status, 0, dry2.stderr || dry2.stdout)
assert.match(dry2.stdout, /Notification queued/)

console.log("telegram-notify.selfcheck: ok")
