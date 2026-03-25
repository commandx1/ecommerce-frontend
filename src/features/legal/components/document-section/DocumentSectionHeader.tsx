import DocumentSectionActions from "@/features/legal/components/document-section/DocumentSectionActions"
import type { LegalDocument } from "@/features/legal/types"
import { iconMap } from "./documentIcons"

interface DocumentSectionHeaderProps {
  document: LegalDocument
}

const DocumentSectionHeader = ({ document }: DocumentSectionHeaderProps) => {
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
      <DocumentSectionActions />
    </div>
  )
}

export default DocumentSectionHeader
