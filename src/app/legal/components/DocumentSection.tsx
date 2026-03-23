"use client"

import DocumentNotice from "./document-section/DocumentNotice"
import DocumentSectionContent from "./document-section/DocumentSectionContent"
import DocumentSectionHeader from "./document-section/DocumentSectionHeader"
import { useDocumentActions } from "../hooks/useDocumentActions"
import type { LegalDocument } from "../types"

interface DocumentSectionProps {
  document: LegalDocument
}

const DocumentSection = ({ document }: DocumentSectionProps) => {
  const { handleDownload, handlePrint } = useDocumentActions()

  return (
    <section id={document.id} className="bg-white rounded-2xl shadow-lg p-8 mb-8 scroll-mt-24">
      <DocumentSectionHeader document={document} onPrint={handlePrint} onDownload={handleDownload} />

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
