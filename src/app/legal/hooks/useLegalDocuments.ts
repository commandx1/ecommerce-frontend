import { useMemo, useState } from "react"

import legalAdditionalData from "@/data/legal-additional.json"
import legalDocumentsData from "@/data/legal-documents.json"

import type { LegalDocument } from "../types"

const additionalDocuments: LegalDocument[] = [
  legalAdditionalData.vendorAgreement,
  legalAdditionalData.buyerAgreement,
  legalAdditionalData.dataProcessing,
  legalAdditionalData.cookiePolicy as LegalDocument,
  legalAdditionalData.regulatoryNotices as LegalDocument,
  legalAdditionalData.complianceCertifications as LegalDocument,
  legalAdditionalData.auditReports as LegalDocument,
]

const findDocumentById = (id: string): LegalDocument | undefined => {
  const primaryMatch = legalDocumentsData.documents.find((document) => document.id === id) as LegalDocument | undefined
  return primaryMatch ?? additionalDocuments.find((document) => document.id === id)
}

export const useLegalDocuments = () => {
  const firstId = legalDocumentsData.sidebarNav[0]?.id ?? "terms-of-service"
  const [selectedId, setSelectedId] = useState<string>(firstId)

  const documentsInOrder = useMemo(() => {
    return legalDocumentsData.sidebarNav.map((item) => findDocumentById(item.id)).filter(Boolean) as LegalDocument[]
  }, [])

  const selectedDocument = useMemo(
    () => documentsInOrder.find((document) => document.id === selectedId) ?? documentsInOrder[0],
    [documentsInOrder, selectedId],
  )

  return {
    documentsInOrder,
    selectedDocument,
    selectedId,
    setSelectedId,
  }
}
