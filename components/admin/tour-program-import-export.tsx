"use client"

import { useActionState, useEffect, useMemo, useRef, useState } from "react"
import { Download, FileSpreadsheet, LoaderCircle, Upload } from "lucide-react"
import { toast } from "sonner"
import { Alert, Button, Card, CardBody, CardHeader, CardTitle, Input, Select } from "@/components/admin/ui"
import {
  exportTourProgramAction,
  importTourProgramAction,
  type ImportProgramState,
} from "@/app/admin/tour-program-io-actions"

type ProgramTourOption = { id: number; title: string; country: string }

function downloadBase64(base64: string, filename: string) {
  const bytes = atob(base64)
  const buffer = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i)
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function TourProgramImportExport({ tours }: { tours: ProgramTourOption[] }) {
  const [exporting, setExporting] = useState(false)
  const [scope, setScope] = useState<"all" | "one">("all")
  const [tourId, setTourId] = useState<string>(tours[0]?.id ? String(tours[0].id) : "")
  const [includeWhatIncluded, setIncludeWhatIncluded] = useState(true)
  const [tourQuery, setTourQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [state, formAction, pending] = useActionState<ImportProgramState, FormData>(importTourProgramAction, null)

  const filteredTours = useMemo(() => {
    const needle = tourQuery.trim().toLowerCase()
    if (!needle) return tours
    return tours.filter((t) => [t.title, t.country].some((v) => v.toLowerCase().includes(needle)))
  }, [tourQuery, tours])

  // Если выбранный тур пропал из отфильтрованного списка — переключаемся на первый доступный.
  useEffect(() => {
    if (scope !== "one") return
    if (!filteredTours.some((t) => String(t.id) === tourId)) {
      setTourId(filteredTours[0]?.id ? String(filteredTours[0].id) : "")
    }
  }, [filteredTours, scope, tourId])

  async function handleExport() {
    if (scope === "one" && !tourId) {
      toast.error("Выберите тур для выгрузки")
      return
    }
    setExporting(true)
    try {
      const result = await exportTourProgramAction({
        tourIds: scope === "all" ? "all" : [Number(tourId)],
        includeWhatIncluded,
      })
      if (result.success) {
        downloadBase64(result.base64, result.filename)
        toast.success("Файл сформирован")
      } else {
        toast.error(result.error)
      }
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    if (state?.updatedCount && fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [state])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          <CardTitle>Программа и «что входит» через Excel</CardTitle>
        </div>
        <p className="mt-1 text-xs text-admin-fg-muted">
          Выгрузите программу туров «по дням» (и, по желанию, блок «что входит») в Excel, отредактируйте и загрузите
          обратно. Можно выгрузить все автобусные туры сразу или один выбранный. Не меняйте «#ID» в начале названия
          листа и заголовки колонок.
        </p>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-admin-fg-muted">
            Что выгружать
            <Select value={scope} onChange={(e) => setScope(e.target.value as "all" | "one")}>
              <option value="all">Все автобусные туры</option>
              <option value="one">Один выбранный тур</option>
            </Select>
          </label>

          {scope === "one" ? (
            <>
              <label className="flex flex-col gap-1 text-xs font-medium text-admin-fg-muted">
                Поиск тура
                <Input value={tourQuery} onChange={(e) => setTourQuery(e.target.value)} placeholder="По названию или стране" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-admin-fg-muted">
                Тур
                <Select value={tourId} onChange={(e) => setTourId(e.target.value)}>
                  {filteredTours.length === 0 ? <option value="">Ничего не найдено</option> : null}
                  {filteredTours.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                      {t.country ? ` — ${t.country}` : ""}
                    </option>
                  ))}
                </Select>
              </label>
            </>
          ) : null}
        </div>

        <label className="flex items-center gap-2 text-sm text-admin-fg">
          <input
            type="checkbox"
            checked={includeWhatIncluded}
            onChange={(e) => setIncludeWhatIncluded(e.target.checked)}
            className="h-4 w-4 rounded border-admin-border"
          />
          Включать блок «что входит / не входит»
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Скачать Excel
          </Button>

          <form action={formAction} className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              name="file"
              accept=".xlsx"
              required
              className="text-sm text-admin-fg-muted file:mr-3 file:rounded-md file:border file:border-admin-border file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-admin-fg hover:file:bg-admin-muted"
            />
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {pending ? "Загрузка…" : "Загрузить Excel"}
            </Button>
          </form>
        </div>

        <p className="text-xs text-admin-fg-subtle">
          При загрузке блок «что входит» обновляется, только если в файле есть строки типа «Группа» — файл без них не
          затрёт уже заполненный блок.
        </p>

        {state?.updatedCount ? (
          <Alert tone="info" title={`Обновлено туров: ${state.updatedCount}`}>
            <p className="text-sm">{state.updatedTitles?.join(", ")}</p>
          </Alert>
        ) : null}

        {state?.error && !state.updatedCount ? (
          <Alert tone="danger" title="Импорт не выполнен">
            <p className="text-sm">{state.error}</p>
          </Alert>
        ) : null}

        {state?.errors?.length ? (
          <Alert tone="warning" title={`Пропущено строк/листов: ${state.errors.length}`}>
            <ul className="mt-1 space-y-1 text-sm">
              {state.errors.slice(0, 20).map((e, i) => (
                <li key={i}>
                  <span className="font-medium">{e.sheet}</span>
                  {e.row ? `, строка ${e.row}` : ""}: {e.message}
                </li>
              ))}
              {state.errors.length > 20 ? <li>… и ещё {state.errors.length - 20}</li> : null}
            </ul>
          </Alert>
        ) : null}
      </CardBody>
    </Card>
  )
}
