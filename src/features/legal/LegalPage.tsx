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
    <main className="min-h-screen">
      <LegalHero />
      <QuickNavigationCards selectedId={selectedId} />
      <section className="app-container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <LegalPageContent selectedDocument={selectedDocument} selectedId={selectedId} />
      </section>
      <ContactSupport />
      <LegalArchive />
    </main>
  )
}
