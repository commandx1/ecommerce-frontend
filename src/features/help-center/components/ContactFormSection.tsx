import PageSectionContainer from "@/components/layout/PageSectionContainer"
import ContactForm from "@/features/help-center/components/ContactForm"
import ContactFormInfo from "@/features/help-center/components/ContactFormInfo"

export default function ContactFormSection() {
  return (
    <PageSectionContainer as="section" className="bg-canvas py-16">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <ContactFormInfo />
        <ContactForm />
      </div>
    </PageSectionContainer>
  )
}
