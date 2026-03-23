"use client"

import type { ChangeEventHandler, FormEventHandler } from "react"
import { Send } from "lucide-react"
import { SelectField } from "@/components/form/SelectField"
import { TextAreaField } from "@/components/form/TextAreaField"
import { TextField } from "@/components/form/TextField"
import { CheckboxField } from "@/components/form/CheckboxField"
import FormAttachmentDropzone from "./FormAttachmentDropzone"
import type { ContactFormData } from "../hooks/useContactForm"

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
]

interface ContactFormProps {
  formData: ContactFormData
  onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  onSubmit: FormEventHandler<HTMLFormElement>
}

const ContactForm = ({ formData, onChange, onSubmit }: ContactFormProps) => {
  return (
    <div className="bg-light-mint-gray rounded-2xl p-8">
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            id="firstName"
            name="firstName"
            type="text"
            label="First Name"
            value={formData.firstName}
            onChange={onChange}
            required
          />
          <TextField
            id="lastName"
            name="lastName"
            type="text"
            label="Last Name"
            value={formData.lastName}
            onChange={onChange}
            required
          />
        </div>

        <TextField
          id="email"
          name="email"
          type="email"
          label="Email Address"
          value={formData.email}
          onChange={onChange}
          required
        />

        <TextField id="phone" name="phone" type="tel" label="Phone Number" value={formData.phone} onChange={onChange} />

        <TextField
          id="company"
          name="company"
          type="text"
          label="Practice/Company Name"
          value={formData.company}
          onChange={onChange}
        />

        <SelectField id="subject" name="subject" label="Subject" value={formData.subject} onChange={onChange} required>
          <option value="">Select a topic...</option>
          {SUBJECT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <TextAreaField
          id="message"
          name="message"
          rows={5}
          label="Message"
          value={formData.message}
          onChange={onChange}
          placeholder="Please provide as much detail as possible about your inquiry..."
          required
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Attachment (Optional)</label>
          <FormAttachmentDropzone
            title="Drop files here or"
            actionLabel="browse"
            helperText="Max file size: 10MB. Supported formats: PDF, JPG, PNG, DOC"
          />
        </div>

        <CheckboxField
          id="newsletter"
          name="subscribe"
          checked={formData.subscribe}
          onChange={onChange}
          label="Subscribe to our newsletter for updates and exclusive offers"
        />

        <button
          type="submit"
          className="w-full bg-steel-blue text-white py-4 px-6 rounded-lg hover:bg-opacity-90 font-semibold text-lg transition-colors flex items-center justify-center"
        >
          Send Message
          <Send className="ml-2 w-5 h-5" />
        </button>
      </form>
    </div>
  )
}

export default ContactForm
