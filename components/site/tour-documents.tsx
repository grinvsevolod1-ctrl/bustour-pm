import { FileText, FileSpreadsheet, FileImage, FileArchive, File as FileIcon, Download } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { TourDocument } from "@/lib/types"

// Реальный формат файла берём из расширения ссылки (или названия), чтобы не
// показывать всем документам иконку/подпись PDF, когда на самом деле это Word.
function fileExt(doc: TourDocument): string {
  const src = (doc.href || doc.title || "").toLowerCase()
  const match = src.match(/\.([a-z0-9]{2,5})(?:[?#].*)?$/)
  return match?.[1] ?? ""
}

// Категория формата → иконка + человекочитаемая подпись.
function formatMeta(ext: string): { Icon: LucideIcon; label: string } {
  switch (ext) {
    case "pdf":
      return { Icon: FileText, label: "PDF" }
    case "doc":
    case "docx":
    case "rtf":
    case "odt":
      return { Icon: FileText, label: ext.toUpperCase() }
    case "xls":
    case "xlsx":
    case "csv":
    case "ods":
      return { Icon: FileSpreadsheet, label: ext.toUpperCase() }
    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
    case "gif":
    case "svg":
      return { Icon: FileImage, label: ext.toUpperCase() }
    case "zip":
    case "rar":
    case "7z":
      return { Icon: FileArchive, label: ext.toUpperCase() }
    default:
      return { Icon: FileIcon, label: ext ? ext.toUpperCase() : "Файл" }
  }
}

export function TourDocuments({ documents }: { documents: TourDocument[] }) {
  const valid = documents.filter((d) => d.title?.trim() || d.href?.trim())
  if (!valid.length) return null

  return (
    <ul className="space-y-3">
      {valid.map((doc, i) => {
        const { Icon, label } = formatMeta(fileExt(doc))
        return (
          <li key={doc.href || `${doc.title}-${i}`} className="flex items-center gap-4 rounded-lg border border-line p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-cream text-price">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-medium text-ink">{doc.title || "Документ"}</span>
              <span className="rounded bg-cream px-1.5 py-0.5 text-[11px] font-semibold uppercase text-ink-muted">
                {label}
              </span>
            </span>
            <a
              href={doc.href || "#"}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-cyan-accent transition-colors hover:text-cyan-dark"
            >
              <Download className="h-4 w-4" aria-hidden />
              {doc.size ? `Скачать: ${doc.size}` : "Скачать"}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
