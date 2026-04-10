"use client"

import ContactFormAttachmentField from "@/features/help-center/components/contact-form/ContactFormAttachmentField"
import ContactFormIdentityFields from "@/features/help-center/components/contact-form/ContactFormIdentityFields"
import ContactFormSubjectMessageFields from "@/features/help-center/components/contact-form/ContactFormSubjectMessageFields"
import ContactFormSubmitActions from "@/features/help-center/components/contact-form/ContactFormSubmitActions"
import { useContactForm } from "@/features/help-center/hooks/useContactForm"

const ContactForm = () => {
  const { formData, handleChange, handleSubmit } = useContactForm()

  return (
    <div className="rounded-3xl border border-border-soft bg-surface-elevated p-8 shadow-soft">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <ContactFormIdentityFields formData={formData} onChange={handleChange} />
        <ContactFormSubjectMessageFields formData={formData} onChange={handleChange} />
        <ContactFormAttachmentField />
        <ContactFormSubmitActions isSubscribed={formData.subscribe} onChange={handleChange} />
      </form>
    </div>
  )
}

export default ContactForm
