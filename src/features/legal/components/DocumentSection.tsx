import DocumentNotice from "@/features/legal/components/document-section/DocumentNotice"
import DocumentSectionContent from "@/features/legal/components/document-section/DocumentSectionContent"
import DocumentSectionHeader from "@/features/legal/components/document-section/DocumentSectionHeader"
import type { LegalDocument } from "@/features/legal/types"

interface DocumentSectionProps {
  document: LegalDocument
}

const DocumentSection = ({ document }: DocumentSectionProps) => {
  return (
    <section id={document.id} className="bg-white rounded-2xl shadow-lg p-8 mb-8 scroll-mt-24">
      <DocumentSectionHeader document={document} />

      <div className="prose max-w-none">
        {document.notice && <DocumentNotice notice={document.notice} />}
        {document.sections?.map((section) => (
          <DocumentSectionContent key={section.title} section={section} />
        ))}
      </div>
    </section>
  )
}

export default DocumentSection
