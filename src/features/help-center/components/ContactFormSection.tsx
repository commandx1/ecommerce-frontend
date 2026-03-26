import PageSectionContainer from "@/components/layout/PageSectionContainer"
import ContactForm from "@/features/help-center/components/ContactForm"
import ContactFormInfo from "@/features/help-center/components/ContactFormInfo"

export default function ContactFormSection() {
  return (
    <PageSectionContainer as="section" className="py-16 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <ContactFormInfo />
        <ContactForm />
      </div>
    </PageSectionContainer>
  )
}
