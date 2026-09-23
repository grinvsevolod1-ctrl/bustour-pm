/**
 * Selfcheck sealed-env: полный цикл init → seal → apply на временных файлах
 * и совместимость записанного .env с тремя парсерами сервера
 * (bash `. ./.env`, ecosystem.config.cjs, dotenv-подобный parseEnvText).
 *
 *   npx tsx scripts/sealed-env.selfcheck.ts
 */
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const root = process.cwd()
const cli = join(root, "scripts/sealed-env.mjs")

function run(args: string[], expectOk = true) {
  const res = spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: "utf8" })
  if (expectOk) assert.equal(res.status, 0, `${args.join(" ")} → exit ${res.status}\n${res.stdout}\n${res.stderr}`)
  return res
}

const work = mkdtempSync(join(tmpdir(), "sealed-env-"))
try {
  const keyDir = join(work, ".seal")
  const sealedDir = join(work, "sealed")
  const envFile = join(work, ".env")

  // 1. init идемпотентен, приватный ключ закрыт правами
  run(["init", "--key-dir", keyDir])
  const firstPriv = readFileSync(join(keyDir, "private.pem"), "utf8")
  run(["init", "--key-dir", keyDir])
  assert.equal(readFileSync(join(keyDir, "private.pem"), "utf8"), firstPriv, "повторный init не должен менять ключ")
  assert.equal(statSync(join(keyDir, "private.pem")).mode & 0o777, 0o600)

  // 2. seal: значения с «опасными» для bash символами
  const secrets = {
    SMTP_HOST: "smtp.hoster.by",
    SMTP_PORT: "465",
    SMTP_PASS: "12Pass34!$x",
    LEAD_EMAIL_FROM: '"Заявка с сайта bus-tour.by" <booking@bus-tour.by>',
    TELEGRAM_BOT_TOKEN: "123456:AAxx-yy_zz",
  }
  const sealedFile = join(sealedDir, "10-notify.json")
  run([
    "seal",
    "--pub",
    join(keyDir, "public.pem"),
    "--out",
    sealedFile,
    ...Object.entries(secrets).map(([k, v]) => `${k}=${v}`),
  ])
  const sealed = JSON.parse(readFileSync(sealedFile, "utf8"))
  assert.equal(sealed.format, "bastur-sealed-env/1")
  assert.deepEqual(sealed.keys, Object.keys(secrets).sort())
  for (const v of Object.values(secrets)) {
    assert.ok(!readFileSync(sealedFile, "utf8").includes(v), "секрет не должен лежать в файле открытым текстом")
  }
  const inspect = run(["inspect", sealedFile])
  assert.match(inspect.stdout, /SMTP_PASS/)
  assert.doesNotMatch(inspect.stdout, /12Pass34/)

  // 3. apply в существующий .env: комментарии и порядок сохраняются, ключи дописываются
  const original = "# домен\nNEXT_PUBLIC_SITE_URL=https://bus-tour.by\nPORT=3000\n"
  writeFileSync(envFile, original, { mode: 0o600 })
  const applied = run(["apply", "--key-dir", keyDir, "--env", envFile, "--in", sealedDir])
  assert.match(applied.stdout, /SMTP_PASS \(добавлено\)/)
  assert.doesNotMatch(applied.stdout, /12Pass34/, "apply не должен печатать значения")
  const envText = readFileSync(envFile, "utf8")
  assert.ok(envText.startsWith(original.trimEnd()), "начало .env не тронуто")
  assert.equal(statSync(envFile).mode & 0o777, 0o600, "права .env сохранены")

  // 4. Повторный apply — без изменений (идемпотентность)
  const again = run(["apply", "--key-dir", keyDir, "--env", envFile, "--in", sealedDir])
  assert.match(again.stdout, /SMTP_PASS \(без изменений\)/)
  assert.equal(readFileSync(envFile, "utf8"), envText)

  // 5. bash читает те же значения, что мы запечатали (в т.ч. `<адрес>` и `!$`)
  for (const [key, expected] of Object.entries(secrets)) {
    const bash = spawnSync("bash", ["-c", `set -a; . "${envFile}"; printf %s "\${${key}}"`], { encoding: "utf8" })
    assert.equal(bash.status, 0, bash.stderr)
    assert.equal(bash.stdout, expected, `bash прочитал ${key} иначе`)
  }

  // 6. ecosystem.config.cjs-парсер (снятие внешних кавычек) читает то же
  const pm2Like: Record<string, string> = {}
  for (const raw of envText.split("\n")) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq <= 0) continue
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    pm2Like[line.slice(0, eq).trim()] = value
  }
  for (const [key, expected] of Object.entries(secrets)) assert.equal(pm2Like[key], expected, `pm2 прочитал ${key} иначе`)

  // 7. Файл, запечатанный чужим ключом, пропускается с предупреждением, остальные применяются
  const otherKeyDir = join(work, ".seal-other")
  run(["init", "--key-dir", otherKeyDir])
  run(["seal", "--pub", join(otherKeyDir, "public.pem"), "--out", join(sealedDir, "20-foreign.json"), "FOREIGN=1"])
  const mixed = run(["apply", "--key-dir", keyDir, "--env", envFile, "--in", sealedDir])
  assert.match(mixed.stderr, /запечатан ключом/)
  assert.doesNotMatch(readFileSync(envFile, "utf8"), /FOREIGN/)

  // 8. Битый файл не валит apply
  writeFileSync(join(sealedDir, "30-broken.json"), "{not json")
  const broken = run(["apply", "--key-dir", keyDir, "--env", envFile, "--in", sealedDir])
  assert.match(broken.stderr, /повреждён/)

  // 9. Без приватного ключа apply — предупреждение, exit 0
  const noKey = run(["apply", "--key-dir", join(work, "missing"), "--env", envFile, "--in", sealedDir])
  assert.match(noKey.stderr, /приватный ключ не найден/)

  assert.ok(existsSync(join(root, "app/api/seal-key/route.ts")), "нужен route для публичного ключа")
  assert.match(readFileSync(join(root, "deploy.sh"), "utf8"), /sealed-env\.mjs init[\s\S]*sealed-env\.mjs apply/)
  assert.match(readFileSync(join(root, ".gitignore"), "utf8"), /^\.seal\/$/m)

  console.log("ok")
} finally {
  rmSync(work, { recursive: true, force: true })
}
