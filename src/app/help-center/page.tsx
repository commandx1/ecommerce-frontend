import ContactFormSection from "./components/ContactFormSection"
import EmergencySupportSection from "./components/EmergencySupportSection"
import FAQSection from "./components/FAQSection"
import HelpCenterBreadcrumb from "./components/HelpCenterBreadcrumb"
import HelpCenterHero from "./components/HelpCenterHero"
import KnowledgeBaseSection from "./components/KnowledgeBaseSection"
import QuickSupportOptions from "./components/QuickSupportOptions"
import SupportResourcesSection from "./components/SupportResourcesSection"
import SupportTeamSection from "./components/SupportTeamSection"
import TicketSubmissionSection from "./components/TicketSubmissionSection"

export default function HelpCenterPage() {
  return (
    <main className="min-h-screen bg-light-mint-gray font-(--font-inter)">
      <HelpCenterBreadcrumb />
      <HelpCenterHero />
      <QuickSupportOptions />
      <FAQSection />
      <ContactFormSection />
      <TicketSubmissionSection />
      <SupportResourcesSection />
      <KnowledgeBaseSection />
      {/* <SystemStatusSection /> */}
      <SupportTeamSection />
      <EmergencySupportSection />
    </main>
  )
}
