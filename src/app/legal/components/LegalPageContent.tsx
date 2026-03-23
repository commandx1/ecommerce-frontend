"use client"

import DocumentSection from "./DocumentSection"
import LegalSidebar from "./LegalSidebar"
import { useLegalDocuments } from "../hooks/useLegalDocuments"

export default function LegalPageContent() {
  const { selectedId, setSelectedId, selectedDocument } = useLegalDocuments()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <LegalSidebar selectedId={selectedId} onSelect={setSelectedId} />
      <div id="document-content" className="lg:col-span-3">
        {selectedDocument && <DocumentSection document={selectedDocument} />}
      </div>
    </div>
  )
}
