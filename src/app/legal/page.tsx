import legalAdditionalData from "@/data/legal-additional.json"
import legalDocumentsData from "@/data/legal-documents.json"
import ContactSupport from "./components/ContactSupport"
import DocumentSection from "./components/DocumentSection"
import LegalArchive from "./components/LegalArchive"
import LegalBreadcrumb from "./components/LegalBreadcrumb"
import LegalHero from "./components/LegalHero"
import LegalSidebar from "./components/LegalSidebar"
import QuickNavigationCards from "./components/QuickNavigationCards"

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
  sections?: Array<{
    title: string
    content?: string
    list?: string[]
    items?: string[]
    cards?: Array<{
      title: string
      icon?: string
      text?: string
      items?: string[]
    }>
    warning?: boolean
    pricing?: Array<{
      value: string
      label: string
      note: string
    }>
    steps?: Array<{
      step: number
      title: string
      description: string
    }>
    paymentOptions?: Array<{
      title: string
      items: string[]
    }>
    cookieTypes?: Array<{
      title: string
      icon: string
      description: string
    }>
    managementOptions?: Array<{
      title: string
      description: string
    }>
    deviceClasses?: Array<{
      class: string
      items: string[]
    }>
    certifications?: Array<{
      title: string
      icon: string
      description: string
      status: string
    }>
    securityStandards?: Array<{
      title: string
      items: string[]
    }>
    reports?: Array<{
      title: string
      description: string
      period: string
      auditor: string
      status: string
    }>
  }>
}

export default function LegalPage() {
  return (
    <>
      <LegalBreadcrumb />
      <LegalHero />
      <QuickNavigationCards />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <LegalSidebar />
          <div id="document-content" className="lg:col-span-3">
            {legalDocumentsData.documents.map((doc) => (
              <DocumentSection key={doc.id} document={doc as LegalDocument} />
            ))}
            <DocumentSection document={legalAdditionalData.vendorAgreement as any} />
            <DocumentSection document={legalAdditionalData.buyerAgreement as any} />
            <DocumentSection document={legalAdditionalData.dataProcessing as any} />
            <DocumentSection document={legalAdditionalData.cookiePolicy as any} />
            <DocumentSection document={legalAdditionalData.regulatoryNotices as any} />
            <DocumentSection document={legalAdditionalData.complianceCertifications as any} />
            <DocumentSection document={legalAdditionalData.auditReports as any} />
          </div>
        </div>
      </div>
      <ContactSupport />
      <LegalArchive />
    </>
  )
}
