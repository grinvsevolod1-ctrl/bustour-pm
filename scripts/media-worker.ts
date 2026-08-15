import { closeDbPool } from "../lib/db"
import { mediaService } from "../lib/media/service"
import { findOrphanMedia } from "../lib/orphan-media-cleanup"
import { buildMediaCorpus, loadMediaCandidates } from "./orphan-media-cleanup"

const pollMs = Number(process.env.MEDIA_WORKER_POLL_MS || 3000)
const leaseMs = Number(process.env.MEDIA_WORKER_LEASE_MS || 120000)
// Периодическая чистка сирот-медиа: раз в сутки пишем отчёт в лог.
// Автоудаление включается явно: MEDIA_ORPHAN_AUTO_DELETE=1 в .env —
// по умолчанию только отчёт, чтобы ложное срабатывание не стёрло файл.
const orphanScanMs = Number(process.env.MEDIA_ORPHAN_SCAN_MS || 24 * 60 * 60 * 1000)
const orphanAutoDelete = process.env.MEDIA_ORPHAN_AUTO_DELETE === "1"
let lastOrphanScan = 0

let stopping = false

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function maybeScanOrphans() {
  const now = Date.now()
  if (now - lastOrphanScan < orphanScanMs) return
  lastOrphanScan = now
  try {
    const [corpus, files] = await Promise.all([buildMediaCorpus(), loadMediaCandidates()])
    const report = findOrphanMedia(files, corpus)
    console.log(
      `[media-worker] orphan scan: checked=${report.totalChecked} orphans=${report.orphans.length} autoDelete=${orphanAutoDelete}`,
    )
    for (const orphan of report.orphans) {
      console.log(`[media-worker] orphan: ${orphan.id} «${orphan.name}» ${orphan.url}`)
      if (orphanAutoDelete) {
        await mediaService.deleteFile(orphan.id).catch((err: unknown) => {
          console.error(`[media-worker] orphan delete failed ${orphan.id}:`, (err as Error).message)
        })
      }
    }
  } catch (error) {
    // Сканирование — вспомогательная задача: её сбой не должен ронять worker.
    console.error("[media-worker] orphan scan failed:", (error as Error).message)
  }
}

async function loop() {
  while (!stopping) {
    await maybeScanOrphans()

    const job = await mediaService.claimNextProcessingMedia(leaseMs)
    if (!job) {
      await delay(pollMs)
      continue
    }

    console.log(`[media-worker] processing ${job.id} type=${job.type} stage=${job.processingStage}`)

    const result = await mediaService.processMediaJob(job)
    console.log(`[media-worker] finished ${job.id} status=${result.status} stage=${result.processingStage}`)
  }
}

async function shutdown(signal: string) {
  if (stopping) return
  stopping = true
  console.log(`[media-worker] received ${signal}, shutting down`)
  await closeDbPool().catch((error) => {
    console.error("[media-worker] failed to close pool", error)
  })
  process.exit(0)
}

process.on("SIGINT", () => void shutdown("SIGINT"))
process.on("SIGTERM", () => void shutdown("SIGTERM"))

loop()
  .catch(async (error) => {
    console.error("[media-worker] fatal error", error)
    await closeDbPool().catch(() => {})
    process.exit(1)
  })
