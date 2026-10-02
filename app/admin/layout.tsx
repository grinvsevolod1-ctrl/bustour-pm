import type { Metadata } from "next"
import { AdminToaster } from "@/components/admin/admin-toaster"
/* Базовые стили ProseMirror (white-space, курсор, gap-cursor) нужны только
   редакторам админки; без них tiptap пишет "no stylesheet loaded". */
import "prosemirror-view/style/prosemirror.css"
/* «Хром» редактора TipTap и полей шорткодов — вынесен из app/globals.css,
   чтобы ~700 строк CSS не грузились на каждой публичной странице. */
import "./editor.css"

export const metadata: Metadata = {
  title: "Админ — БасТур",
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AdminToaster />
    </>
  )
}
