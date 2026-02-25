"use client"

import { useMemo, useState } from "react"
import legalAdditionalData from "@/data/legal-additional.json"
import legalDocumentsData from "@/data/legal-documents.json"
import DocumentSection from "./DocumentSection"
import LegalSidebar from "./LegalSidebar"

interface LegalDocument {
  id: string
  title: string
  subtitle?: string
  lastUpdated?: string
  icon?: string
  notice?: {
    type: "warning" | "success" | "info" | "error"
    title: string
    text: string
  }
  sections?: Array<Record<string, unknown>>
}

const additionalDocs = [
  legalAdditionalData.vendorAgreement,
  legalAdditionalData.buyerAgreement,
  legalAdditionalData.dataProcessing,
  legalAdditionalData.cookiePolicy,
  legalAdditionalData.regulatoryNotices,
  legalAdditionalData.complianceCertifications,
  legalAdditionalData.auditReports,
] as LegalDocument[]

const docById = (id: string): LegalDocument | undefined =>
  legalDocumentsData.documents.find((d: { id: string }) => d.id === id) as LegalDocument | undefined ||
  additionalDocs.find((d) => d.id === id)

export default function LegalPageContent() {
  const firstId = legalDocumentsData.sidebarNav[0]?.id ?? "terms-of-service"
  const [selectedId, setSelectedId] = useState<string>(firstId)

  const documentsInOrder = useMemo(() => {
    return legalDocumentsData.sidebarNav
      .map((item: { id: string }) => docById(item.id))
      .filter(Boolean) as LegalDocument[]
  }, [])

  const selectedDocument = useMemo(
    () => documentsInOrder.find((d) => d.id === selectedId) ?? documentsInOrder[0],
    [documentsInOrder, selectedId]
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <LegalSidebar
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <div id="document-content" className="lg:col-span-3">
        {selectedDocument && (
          <DocumentSection document={selectedDocument as Parameters<typeof DocumentSection>[0]["document"]} />
        )}
      </div>
    </div>
  )
}
