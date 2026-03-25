import type { ChangeEventHandler } from "react"
import { useId } from "react"

import { SelectField } from "@/components/form/SelectField"
import { TextAreaField } from "@/components/form/TextAreaField"
import type { ContactFormData } from "@/features/help-center/types"

const SUBJECT_OPTIONS = [
  { value: "order", label: "Order Issues" },
  { value: "product", label: "Product Questions" },
  { value: "account", label: "Account Support" },
  { value: "billing", label: "Billing & Payment" },
  { value: "shipping", label: "Shipping & Delivery" },
  { value: "returns", label: "Returns & Exchanges" },
  { value: "technical", label: "Technical Support" },
  { value: "partnership", label: "Partnership Inquiry" },
  { value: "other", label: "Other" },
] as const

interface ContactFormSubjectMessageFieldsProps {
  formData: ContactFormData
  onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
}

export default function ContactFormSubjectMessageFields({ formData, onChange }: ContactFormSubjectMessageFieldsProps) {
  const id = useId()

  return (
    <>
      <SelectField
        id={`${id}-subject`}
        name="subject"
        label="Subject"
        value={formData.subject}
        onChange={onChange}
        required
      >
        <option value="">Select a topic...</option>
        {SUBJECT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <TextAreaField
        id={`${id}-message`}
        name="message"
        rows={5}
        label="Message"
        value={formData.message}
        onChange={onChange}
        placeholder="Please provide as much detail as possible about your inquiry..."
        required
      />
    </>
  )
}
