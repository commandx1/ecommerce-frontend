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
        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-primary-foreground">
          {IconComponent && <IconComponent className="h-6 w-6" />}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">{document.title}</h2>
          {document.subtitle && <p className="text-text-secondary">{document.subtitle}</p>}
          {document.lastUpdated && <p className="text-text-secondary">Last updated: {document.lastUpdated}</p>}
        </div>
      </div>
      <DocumentSectionActions />
    </div>
  )
}

export default DocumentSectionHeader
