import ContactFormSection from "@/features/help-center/components/ContactFormSection"
import EmergencySupportSection from "@/features/help-center/components/EmergencySupportSection"
import FAQSection from "@/features/help-center/components/FAQSection"
import HelpCenterBreadcrumb from "@/features/help-center/components/HelpCenterBreadcrumb"
import HelpCenterHero from "@/features/help-center/components/HelpCenterHero"
import KnowledgeBaseSection from "@/features/help-center/components/KnowledgeBaseSection"
import QuickSupportOptions from "@/features/help-center/components/QuickSupportOptions"
import SupportResourcesSection from "@/features/help-center/components/SupportResourcesSection"
import SupportTeamSection from "@/features/help-center/components/SupportTeamSection"
import TicketSubmissionSection from "@/features/help-center/components/TicketSubmissionSection"

export default function HelpCenterPage() {
  return (
    <main className="min-h-screen bg-canvas">
      <HelpCenterBreadcrumb />
      <HelpCenterHero />
      <QuickSupportOptions />
      <FAQSection />
      <ContactFormSection />
      <TicketSubmissionSection />
      <SupportResourcesSection />
      <KnowledgeBaseSection />
      <SupportTeamSection />
      <EmergencySupportSection />
    </main>
  )
}
