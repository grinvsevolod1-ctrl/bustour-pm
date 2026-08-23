"use client"

// Липкие баннеры статуса загрузчика: общий прогресс передачи и
// «контент в обработке». Вынесены из media-uploader.tsx — чистая разметка
// без состояния.
import { Alert } from "@/components/admin/ui"
import type { PendingUpload } from "@/components/admin/media-uploader/upload-api"

export function TransferBusyBanner({ pendingUploads }: { pendingUploads: PendingUpload[] }) {
  const doneCount = pendingUploads.filter((item) => item.progress >= 100).length
  const overallPct =
    pendingUploads.length === 0
      ? 0
      : Math.round(
          pendingUploads.reduce((sum, item) => sum + Math.max(0, item.progress), 0) /
            pendingUploads.length,
        )

  return (
    <Alert
      tone="warning"
      title="Идёт загрузка"
      className="sticky top-0 z-30 shadow-sm"
    >
      <div className="space-y-2" aria-live="polite" aria-atomic="true">
        <p>
          {pendingUploads.length === 1
            ? `Файл «${pendingUploads[0]!.name}»…`
            : `${doneCount} из ${pendingUploads.length} файлов…`}{" "}
          <span className="font-medium tabular-nums">{overallPct}%</span>
        </p>
        <p className="text-amber-900/80">
          Не закрывайте вкладку и не уходите со страницы — загрузка прервётся. Можно добавить ещё
          файлы в очередь.
        </p>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-amber-200/80"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={overallPct}
          aria-label="Общий прогресс загрузки"
        >
          <div
            className="h-full rounded-full bg-amber-600 transition-[width] duration-200 ease-out motion-reduce:transition-none"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>
    </Alert>
  )
}

export function ProcessingBanner() {
  return (
    <Alert tone="info" title="Контент в обработке" className="sticky top-0 z-20 shadow-sm">
      <div className="space-y-2" aria-live="polite" aria-atomic="true">
        <p>
          Файл уже загружен на сервер. Можно закрыть страницу или перейти в другой раздел —
          обработка продолжится.
        </p>
        <p className="text-blue-800/80">
          Как только сервер закончит обработку, файл появится в медиатеке или обновится в списке.
        </p>
      </div>
    </Alert>
  )
}
