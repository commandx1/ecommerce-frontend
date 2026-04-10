import PageSectionContainer from "@/components/layout/PageSectionContainer"
import ContactSupport from "@/features/legal/components/ContactSupport"
import LegalArchive from "@/features/legal/components/LegalArchive"
import LegalHero from "@/features/legal/components/LegalHero"
import LegalPageContent from "@/features/legal/components/LegalPageContent"
import QuickNavigationCards from "@/features/legal/components/QuickNavigationCards"
import type { LegalDocument } from "@/features/legal/types"

interface LegalPageProps {
  selectedDocument?: LegalDocument
  selectedId: string
}

export default function LegalPage({ selectedDocument, selectedId }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-canvas">
      <LegalHero />
      <QuickNavigationCards selectedId={selectedId} />
      <PageSectionContainer as="section" className="pb-16">
        <LegalPageContent selectedDocument={selectedDocument} selectedId={selectedId} />
      </PageSectionContainer>
      <ContactSupport />
      <LegalArchive />
    </main>
  )
}
