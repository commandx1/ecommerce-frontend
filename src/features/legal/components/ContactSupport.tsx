import PageSectionContainer from "@/components/layout/PageSectionContainer"
import ContactSupportForm from "@/features/legal/components/ContactSupportForm"
import ContactSupportInfo from "@/features/legal/components/ContactSupportInfo"

const ContactSupport = () => {
  return (
    <PageSectionContainer as="section" className="py-16 bg-steel-blue">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <ContactSupportInfo />
        <ContactSupportForm />
      </div>
    </PageSectionContainer>
  )
}

export default ContactSupport
