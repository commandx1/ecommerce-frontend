import legalAdditionalData from "@/data/legal-additional.json"
import legalDocumentsData from "@/data/legal-documents.json"
import type { LegalDocument } from "@/features/legal/types"

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

export function getDocumentsInOrder(): LegalDocument[] {
  return legalDocumentsData.sidebarNav.map((item) => findDocumentById(item.id)).filter(Boolean) as LegalDocument[]
}

export function getSelectedDocument(docId?: string) {
  const documentsInOrder = getDocumentsInOrder()
  const defaultId = legalDocumentsData.sidebarNav[0]?.id ?? "terms-of-service"
  const selectedId = docId && documentsInOrder.some((document) => document.id === docId) ? docId : defaultId
  const selectedDocument = documentsInOrder.find((document) => document.id === selectedId) ?? documentsInOrder[0]

  return {
    selectedId,
    selectedDocument,
  }
}
