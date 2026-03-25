import ContactForm from "@/features/help-center/components/ContactForm"
import ContactFormInfo from "@/features/help-center/components/ContactFormInfo"

export default function ContactFormSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ContactFormInfo />
          <ContactForm />
        </div>
      </div>
    </section>
  )
}
