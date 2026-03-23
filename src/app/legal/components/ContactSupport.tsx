"use client"

import ContactSupportForm from "./ContactSupportForm"
import ContactSupportInfo from "./ContactSupportInfo"
import { useContactSupportForm } from "../hooks/useContactSupportForm"

const ContactSupport = () => {
  const { formData, handleChange, handleSubmit } = useContactSupportForm()

  return (
    <section id="contact-support" className="py-16 bg-steel-blue">
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <ContactSupportInfo />
          <ContactSupportForm formData={formData} onChange={handleChange} onSubmit={handleSubmit} />
        </div>
      </div>
    </section>
  )
}

export default ContactSupport
