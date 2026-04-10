import PageSectionContainer from "@/components/layout/PageSectionContainer"
import ContactSupportForm from "@/features/legal/components/ContactSupportForm"
import ContactSupportInfo from "@/features/legal/components/ContactSupportInfo"

const ContactSupport = () => {
  return (
    <PageSectionContainer as="section" className="bg-brand py-16 text-inverse-foreground dark:bg-brand-surface">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <ContactSupportInfo />
        <ContactSupportForm />
      </div>
    </PageSectionContainer>
  )
}

export default ContactSupport
