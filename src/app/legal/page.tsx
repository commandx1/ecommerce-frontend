import ContactSupport from "./components/ContactSupport"
import LegalArchive from "./components/LegalArchive"
import LegalHero from "./components/LegalHero"
import LegalPageContent from "./components/LegalPageContent"
import QuickNavigationCards from "./components/QuickNavigationCards"

export default function LegalPage() {
  return (
    <>
      <LegalHero />
      <QuickNavigationCards />
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <LegalPageContent />
      </div>
      <ContactSupport />
      <LegalArchive />
    </>
  )
}
