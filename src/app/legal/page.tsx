import legalAdditionalData from "@/data/legal-additional.json"
import legalDocumentsData from "@/data/legal-documents.json"
import ContactSupport from "./components/ContactSupport"
import DocumentSection from "./components/DocumentSection"
import LegalArchive from "./components/LegalArchive"
import LegalBreadcrumb from "./components/LegalBreadcrumb"
import LegalHero from "./components/LegalHero"
import LegalSidebar from "./components/LegalSidebar"
import QuickNavigationCards from "./components/QuickNavigationCards"

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
              <DocumentSection key={doc.id} document={doc} />
            ))}
            <DocumentSection document={legalAdditionalData.vendorAgreement} />
            <DocumentSection document={legalAdditionalData.buyerAgreement} />
            <DocumentSection document={legalAdditionalData.dataProcessing} />
            <DocumentSection document={legalAdditionalData.cookiePolicy} />
            <DocumentSection document={legalAdditionalData.regulatoryNotices} />
            <DocumentSection document={legalAdditionalData.complianceCertifications} />
            <DocumentSection document={legalAdditionalData.auditReports} />
          </div>
        </div>
      </div>
      <ContactSupport />
      <LegalArchive />
    </>
  )
}
