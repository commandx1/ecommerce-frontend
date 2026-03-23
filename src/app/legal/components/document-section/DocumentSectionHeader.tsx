"use client"

import { Download, Printer } from "lucide-react"

import { iconMap } from "./documentIcons"
import type { LegalDocument } from "../../types"

interface DocumentSectionHeaderProps {
  document: LegalDocument
  onPrint: () => void
  onDownload: () => void
}

const DocumentSectionHeader = ({ document, onPrint, onDownload }: DocumentSectionHeaderProps) => {
  const IconComponent = document.icon ? iconMap[document.icon] : iconMap["file-contract"]
  const headerSpacing = ["compliance-certifications", "audit-reports"].includes(document.id) ? 0 : "1.5rem"

  return (
    <div className="flex items-center justify-between" style={{ marginBottom: headerSpacing }}>
      <div className="flex items-center">
        <div className="w-12 h-12 bg-steel-blue rounded-lg flex items-center justify-center mr-4">
          {IconComponent && <IconComponent className="text-white w-6 h-6" />}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-steel-blue">{document.title}</h2>
          {document.subtitle && <p className="text-gray-600">{document.subtitle}</p>}
          {document.lastUpdated && <p className="text-gray-600">Last updated: {document.lastUpdated}</p>}
        </div>
      </div>
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onPrint}
          className="bg-light-mint-gray text-steel-blue px-4 py-2 rounded-lg hover:bg-opacity-80 font-medium flex items-center transition-colors"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="bg-steel-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 font-medium flex items-center transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </button>
      </div>
    </div>
  )
}

export default DocumentSectionHeader
