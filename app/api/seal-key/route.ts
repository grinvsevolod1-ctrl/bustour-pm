import { createHash, createPublicKey } from "node:crypto"
import { readFile } from "node:fs/promises"
import path from "node:path"

export const dynamic = "force-dynamic"

/**
 * Публичный ключ сервера для запечатывания секретов (scripts/sealed-env.mjs).
 * Ключ публичный по определению — раздавать его безопасно; приватная половина
 * лежит в .seal/private.pem вне git и никогда не читается приложением.
 * Отпечаток в заголовке X-Seal-Key-Id совпадает с keyId в ops/sealed-env/*.json.
 */
export async function GET() {
  try {
    const pem = await readFile(path.join(process.cwd(), ".seal", "public.pem"), "utf8")
    const der = createPublicKey(pem).export({ type: "spki", format: "der" })
    const keyId = createHash("sha256").update(der).digest("hex").slice(0, 16)
    return new Response(pem, {
      headers: {
        "content-type": "application/x-pem-file; charset=utf-8",
        "x-seal-key-id": keyId,
        "cache-control": "no-store",
      },
    })
  } catch {
    return new Response("seal key is not initialised on this server", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    })
  }
}
