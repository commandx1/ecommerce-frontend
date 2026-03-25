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
        className="bg-light-mint-gray text-steel-blue px-4 py-2 rounded-lg hover:bg-opacity-80 font-medium flex items-center transition-colors"
      >
        <Printer className="w-4 h-4 mr-2" />
        Print
      </button>
      <button
        type="button"
        onClick={handleDownload}
        className="bg-steel-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 font-medium flex items-center transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Download PDF
      </button>
    </div>
  )
}
