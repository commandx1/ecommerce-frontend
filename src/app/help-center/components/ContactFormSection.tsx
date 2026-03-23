"use client"

import { useContactForm } from "../hooks/useContactForm"
import ContactForm from "./ContactForm"
import ContactFormInfo from "./ContactFormInfo"

export default function ContactFormSection() {
  const { formData, handleChange, handleSubmit } = useContactForm()

  return (
    <section id="contact-form" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ContactFormInfo />
          <ContactForm formData={formData} onChange={handleChange} onSubmit={handleSubmit} />
        </div>
      </div>
    </section>
  )
}
