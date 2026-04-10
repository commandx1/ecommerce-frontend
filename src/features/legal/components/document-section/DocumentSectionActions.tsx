"use client"

import { Download, Printer } from "lucide-react"
import { useDocumentActions } from "@/features/legal/hooks/useDocumentActions"

export default function DocumentSectionActions() {
  const { handleDownload, handlePrint } = useDocumentActions()

  return (
    <div className="flex space-x-3">
      <button
        type="button"
        onClick={handlePrint}
        className="flex items-center rounded-full bg-surface-muted px-4 py-2 font-medium text-brand transition-colors hover:bg-accent"
      >
        <Printer className="w-4 h-4 mr-2" />
        Print
      </button>
      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center rounded-full bg-brand px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-brand-strong"
      >
        <Download className="w-4 h-4 mr-2" />
        Download PDF
      </button>
    </div>
  )
}
