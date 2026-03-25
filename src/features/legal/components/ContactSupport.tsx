import ContactSupportForm from "@/features/legal/components/ContactSupportForm"
import ContactSupportInfo from "@/features/legal/components/ContactSupportInfo"

const ContactSupport = () => {
  return (
    <section className="py-16 bg-steel-blue">
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <ContactSupportInfo />
          <ContactSupportForm />
        </div>
      </div>
    </section>
  )
}

export default ContactSupport
