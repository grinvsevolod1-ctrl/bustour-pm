#!/usr/bin/env node
/**
 * sealed-env — доставка секретов на VPS через git БЕЗ доступа к серверу
 * и без секретов в открытом виде в репозитории.
 *
 * Схема (аналог sealed-secrets в k8s):
 *   1. deploy.sh на сервере один раз выполняет `init`: в каталоге .seal/
 *      (вне git) появляется пара RSA-4096. Приватный ключ сервер не покидает.
 *   2. Публичный ключ сервер отдаёт по GET /api/seal-key.
 *   3. Разработчик запечатывает секреты этим ключом (`seal`) и коммитит
 *      в ops/sealed-env/*.json только шифртекст (имена ключей — открыто,
 *      чтобы было видно, что внутри).
 *   4. deploy.sh на каждом деплое выполняет `apply`: расшифровывает файлы
 *      приватным ключом и дописывает/обновляет значения в .env, после чего
 *      pm2 startOrReload перечитывает окружение.
 *
 * Криптография: гибридная. Случайный ключ AES-256-GCM шифрует JSON-нагрузку,
 * сам ключ завёрнут RSA-OAEP(SHA-256). Метаданные файла (формат, keyId,
 * дата, список ключей) идут в AAD — подмена метаданных ломает расшифровку.
 *
 * Использование:
 *   node scripts/sealed-env.mjs init    [--key-dir .seal]
 *   node scripts/sealed-env.mjs pubkey  [--key-dir .seal]
 *   node scripts/sealed-env.mjs seal --pub <файл.pem|https://host/api/seal-key> \
 *        --out ops/sealed-env/<имя>.json [--from-file secrets.env] [KEY=VALUE ...]
 *   node scripts/sealed-env.mjs inspect <файл.json>
 *   node scripts/sealed-env.mjs apply   [--key-dir .seal] [--env .env] [--in ops/sealed-env]
 *
 * `apply` никогда не валит деплой из-за одного битого/чужого файла — такие
 * файлы пропускаются с предупреждением, остальные применяются.
 */
import {
  constants,
  createCipheriv,
  createDecipheriv,
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
} from "node:crypto"
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import process from "node:process"
import { describeChanges, parseEnvText, upsertEnvFile } from "./lib/env-file.mjs"

const FORMAT = "bastur-sealed-env/1"
const DEFAULTS = { keyDir: ".seal", envFile: ".env", sealedDir: "ops/sealed-env" }
const RSA_OPTS = { padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }
const TAG = "[sealed-env]"

const log = (...a) => console.log(TAG, ...a)
const warn = (...a) => console.warn(TAG, "ВНИМАНИЕ:", ...a)

function parseArgs(argv) {
  const opts = {}
  const positional = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("--")) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (next !== undefined && !next.startsWith("--")) {
        opts[key] = next
        i++
      } else {
        opts[key] = true
      }
    } else {
      positional.push(a)
    }
  }
  return { opts, positional }
}

/** Короткий отпечаток публичного ключа — связывает запечатанный файл с сервером. */
export function keyIdOf(publicPem) {
  const der = createPublicKey(publicPem).export({ type: "spki", format: "der" })
  return createHash("sha256").update(der).digest("hex").slice(0, 16)
}

function keyPaths(keyDir) {
  return { dir: keyDir, priv: path.join(keyDir, "private.pem"), pub: path.join(keyDir, "public.pem") }
}

function cmdInit(keyDir) {
  const p = keyPaths(keyDir)
  if (existsSync(p.priv)) {
    // Публичный ключ восстанавливаем из приватного, если его удалили.
    if (!existsSync(p.pub)) {
      const pub = createPublicKey(readFileSync(p.priv, "utf8")).export({ type: "spki", format: "pem" })
      writeFileSync(p.pub, pub, { mode: 0o644 })
    }
    log(`ключ уже есть (${p.dir}), keyId=${keyIdOf(readFileSync(p.pub, "utf8"))}`)
    return
  }
  mkdirSync(p.dir, { recursive: true, mode: 0o700 })
  chmodSync(p.dir, 0o700)
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  })
  writeFileSync(p.priv, privateKey, { mode: 0o600 })
  chmodSync(p.priv, 0o600)
  writeFileSync(p.pub, publicKey, { mode: 0o644 })
  log(`ключевая пара создана в ${p.dir}, keyId=${keyIdOf(publicKey)}`)
  log("публичный ключ доступен по GET /api/seal-key после запуска приложения")
}

function cmdPubkey(keyDir) {
  const p = keyPaths(keyDir)
  if (!existsSync(p.pub)) {
    console.error(`${TAG} публичный ключ не найден: ${p.pub} — выполните init`)
    process.exit(1)
  }
  const pem = readFileSync(p.pub, "utf8")
  process.stdout.write(pem.endsWith("\n") ? pem : `${pem}\n`)
  console.error(`${TAG} keyId=${keyIdOf(pem)}`)
}

async function loadPublicKey(source) {
  let pem
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) throw new Error(`не удалось получить публичный ключ: HTTP ${res.status} ${source}`)
    pem = await res.text()
  } else {
    pem = readFileSync(source, "utf8")
  }
  createPublicKey(pem)
  return pem
}

function aadOf(meta) {
  return Buffer.from(
    JSON.stringify({ format: meta.format, keyId: meta.keyId, createdAt: meta.createdAt, keys: meta.keys }),
    "utf8",
  )
}

export function sealPayload(publicPem, values) {
  const keys = Object.keys(values).sort()
  const meta = { format: FORMAT, keyId: keyIdOf(publicPem), createdAt: new Date().toISOString(), keys }
  const dataKey = randomBytes(32)
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", dataKey, iv)
  cipher.setAAD(aadOf(meta))
  const plaintext = Buffer.from(JSON.stringify(values), "utf8")
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const wrappedKey = publicEncrypt({ key: publicPem, ...RSA_OPTS }, dataKey)
  return {
    ...meta,
    wrappedKey: wrappedKey.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  }
}

export function unsealPayload(privatePem, sealed) {
  const dataKey = privateDecrypt(
    { key: createPrivateKey(privatePem), ...RSA_OPTS },
    Buffer.from(sealed.wrappedKey, "base64"),
  )
  const decipher = createDecipheriv("aes-256-gcm", dataKey, Buffer.from(sealed.iv, "base64"))
  decipher.setAAD(aadOf(sealed))
  decipher.setAuthTag(Buffer.from(sealed.tag, "base64"))
  const plaintext = Buffer.concat([decipher.update(Buffer.from(sealed.ciphertext, "base64")), decipher.final()])
  const values = JSON.parse(plaintext.toString("utf8"))
  if (!values || typeof values !== "object" || Array.isArray(values)) throw new Error("нагрузка не объект")
  for (const [k, v] of Object.entries(values)) {
    if (typeof v !== "string") throw new Error(`значение ${k} не строка`)
  }
  const got = Object.keys(values).sort().join(",")
  const declared = [...sealed.keys].sort().join(",")
  if (got !== declared) throw new Error("список ключей в метаданных не совпадает с содержимым")
  return values
}

async function cmdSeal(opts, positional) {
  if (!opts.pub || !opts.out) {
    console.error(`${TAG} нужны --pub <файл|URL> и --out <файл.json>`)
    process.exit(1)
  }
  const values = {}
  if (opts["from-file"]) Object.assign(values, parseEnvText(readFileSync(opts["from-file"], "utf8")))
  for (const pair of positional) {
    const eq = pair.indexOf("=")
    if (eq <= 0) {
      console.error(`${TAG} ожидается KEY=VALUE, получено: ${pair}`)
      process.exit(1)
    }
    values[pair.slice(0, eq)] = pair.slice(eq + 1)
  }
  for (const key of Object.keys(values)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      console.error(`${TAG} недопустимое имя переменной: ${key}`)
      process.exit(1)
    }
  }
  if (!Object.keys(values).length) {
    console.error(`${TAG} нечего запечатывать: передайте KEY=VALUE или --from-file`)
    process.exit(1)
  }
  const publicPem = await loadPublicKey(opts.pub)
  const sealed = sealPayload(publicPem, values)
  mkdirSync(path.dirname(opts.out), { recursive: true })
  writeFileSync(opts.out, `${JSON.stringify(sealed, null, 2)}\n`)
  log(`запечатано ${sealed.keys.length} ключей → ${opts.out} (keyId=${sealed.keyId}): ${sealed.keys.join(", ")}`)
}

function readSealedFile(file) {
  const sealed = JSON.parse(readFileSync(file, "utf8"))
  if (sealed.format !== FORMAT) throw new Error(`неизвестный формат ${sealed.format}`)
  for (const f of ["keyId", "createdAt", "keys", "wrappedKey", "iv", "tag", "ciphertext"]) {
    if (!(f in sealed)) throw new Error(`нет поля ${f}`)
  }
  if (!Array.isArray(sealed.keys)) throw new Error("keys должен быть массивом")
  return sealed
}

function cmdInspect(file) {
  const s = readSealedFile(file)
  log(`${file}: keyId=${s.keyId}, createdAt=${s.createdAt}, ключи: ${s.keys.join(", ")}`)
}

function cmdApply(opts) {
  const keyDir = opts["key-dir"] || DEFAULTS.keyDir
  const envFile = opts.env || DEFAULTS.envFile
  const sealedDir = opts.in || DEFAULTS.sealedDir
  const p = keyPaths(keyDir)

  if (!existsSync(p.priv)) {
    warn(`приватный ключ не найден (${p.priv}) — выполните init; запечатанные секреты не применены`)
    return
  }
  if (!existsSync(sealedDir)) {
    log(`каталог ${sealedDir} отсутствует — запечатанных секретов нет`)
    return
  }
  const files = readdirSync(sealedDir)
    .filter((f) => f.endsWith(".json"))
    .sort()
  if (!files.length) {
    log(`в ${sealedDir} нет *.json — запечатанных секретов нет`)
    return
  }

  const privatePem = readFileSync(p.priv, "utf8")
  const localKeyId = keyIdOf(createPublicKey(privatePem).export({ type: "spki", format: "pem" }))
  const merged = {}
  const origin = {}

  for (const name of files) {
    const file = path.join(sealedDir, name)
    let sealed
    try {
      sealed = readSealedFile(file)
    } catch (err) {
      warn(`${file}: файл повреждён (${err.message}) — пропускаю`)
      continue
    }
    if (sealed.keyId !== localKeyId) {
      warn(
        `${file}: запечатан ключом ${sealed.keyId}, а на сервере ${localKeyId} — пропускаю. ` +
          "Перезапечатайте актуальным ключом с GET /api/seal-key",
      )
      continue
    }
    let values
    try {
      values = unsealPayload(privatePem, sealed)
    } catch (err) {
      warn(`${file}: не расшифровался (${err.message}) — пропускаю`)
      continue
    }
    for (const [key, value] of Object.entries(values)) {
      if (key in merged) warn(`${key} задан и в ${origin[key]}, и в ${name} — берётся из ${name}`)
      merged[key] = value
      origin[key] = name
    }
    log(`${name}: ${Object.keys(values).length} ключей (${sealed.createdAt})`)
  }

  if (!Object.keys(merged).length) {
    warn("ни один запечатанный файл не применён")
    return
  }
  const changes = upsertEnvFile(envFile, merged)
  log(`${envFile}: ${describeChanges(changes)}`)
}

async function main() {
  const [command, ...rest] = process.argv.slice(2)
  const { opts, positional } = parseArgs(rest)
  switch (command) {
    case "init":
      return cmdInit(opts["key-dir"] || DEFAULTS.keyDir)
    case "pubkey":
      return cmdPubkey(opts["key-dir"] || DEFAULTS.keyDir)
    case "seal":
      return cmdSeal(opts, positional)
    case "inspect":
      if (!positional[0]) throw new Error("inspect <файл.json>")
      return cmdInspect(positional[0])
    case "apply":
      return cmdApply(opts)
    default:
      console.error(
        `${TAG} команды: init | pubkey | seal --pub <src> --out <file> [KEY=VALUE...] | inspect <file> | apply`,
      )
      process.exit(command ? 1 : 0)
  }
}

// При импорте из тестов/selfcheck CLI не запускаем.
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname
if (invokedDirectly) {
  main().catch((err) => {
    console.error(`${TAG} ошибка: ${err instanceof Error ? err.message : String(err)}`)
    process.exit(1)
  })
}
