import type { ChangeEventHandler } from "react"
import { useId } from "react"

import { TextField } from "@/components/form/TextField"
import type { ContactFormData } from "@/features/help-center/types"

interface ContactFormIdentityFieldsProps {
  formData: ContactFormData
  onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
}

export default function ContactFormIdentityFields({ formData, onChange }: ContactFormIdentityFieldsProps) {
  const id = useId()

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          id={`${id}-firstName`}
          name="firstName"
          type="text"
          label="First Name"
          value={formData.firstName}
          onChange={onChange}
          required
        />
        <TextField
          id={`${id}-lastName`}
          name="lastName"
          type="text"
          label="Last Name"
          value={formData.lastName}
          onChange={onChange}
          required
        />
      </div>

      <TextField
        id={`${id}-email`}
        name="email"
        type="email"
        label="Email Address"
        value={formData.email}
        onChange={onChange}
        required
      />

      <TextField
        id={`${id}-phone`}
        name="phone"
        type="tel"
        label="Phone Number"
        value={formData.phone}
        onChange={onChange}
      />

      <TextField
        id={`${id}-company`}
        name="company"
        type="text"
        label="Practice/Company Name"
        value={formData.company}
        onChange={onChange}
      />
    </>
  )
}
