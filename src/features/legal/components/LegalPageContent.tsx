import DocumentSection from "@/features/legal/components/DocumentSection"
import LegalSidebar from "@/features/legal/components/LegalSidebar"
import type { LegalDocument } from "@/features/legal/types"

interface LegalPageContentProps {
  selectedDocument?: LegalDocument
  selectedId: string
}

export default function LegalPageContent({ selectedDocument, selectedId }: LegalPageContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <LegalSidebar selectedId={selectedId} />
      <div className="lg:col-span-3">{selectedDocument && <DocumentSection document={selectedDocument} />}</div>
    </div>
  )
}
