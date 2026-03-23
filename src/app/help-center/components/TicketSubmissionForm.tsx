"use client"

import { Ticket } from "lucide-react"
import type { ChangeEventHandler, FormEventHandler } from "react"
import { CheckboxField } from "@/components/form/CheckboxField"
import { SelectField } from "@/components/form/SelectField"
import { TextField } from "@/components/form/TextField"
import type { TicketFormData } from "../hooks/useTicketForm"
import FormAttachmentDropzone from "./FormAttachmentDropzone"
import TicketDescriptionField from "./TicketDescriptionField"
import TicketTipsCard from "./TicketTipsCard"

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low - General inquiry" },
  { value: "normal", label: "Normal - Standard support" },
  { value: "high", label: "High - Business impacting" },
  { value: "urgent", label: "Urgent - Critical issue" },
]

const CATEGORY_OPTIONS = [
  { value: "order-issue", label: "Order Issues" },
  { value: "product-defect", label: "Product Defect" },
  { value: "billing-dispute", label: "Billing Dispute" },
  { value: "account-access", label: "Account Access" },
  { value: "shipping-problem", label: "Shipping Problem" },
  { value: "website-bug", label: "Website Bug" },
  { value: "feature-request", label: "Feature Request" },
  { value: "partnership", label: "Partnership Inquiry" },
]

interface TicketSubmissionFormProps {
  formData: TicketFormData
  onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  onSubmit: FormEventHandler<HTMLFormElement>
}

const TicketSubmissionForm = ({ formData, onChange, onSubmit }: TicketSubmissionFormProps) => {
  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectField
          id="priority"
          name="priority"
          label="Ticket Priority"
          value={formData.priority}
          onChange={onChange}
          required
        >
          <option value="">Select priority level...</option>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          id="category"
          name="category"
          label="Issue Category"
          value={formData.category}
          onChange={onChange}
          required
        >
          <option value="">Select category...</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
      </div>

      <TextField
        id="orderNumber"
        name="orderNumber"
        type="text"
        label="Order Number (if applicable)"
        value={formData.orderNumber}
        onChange={onChange}
        placeholder="e.g., DH-2024-001234"
      />

      <TextField
        id="title"
        name="title"
        type="text"
        label="Ticket Title"
        value={formData.title}
        onChange={onChange}
        placeholder="Brief description of your issue"
        required
      />

      <TicketDescriptionField value={formData.description} onChange={onChange} />

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Attachments</label>
        <FormAttachmentDropzone
          title="Drag and drop files here or"
          actionLabel="browse your computer"
          helperText="Screenshots, documents, or other relevant files (Max 25MB total)"
        />
      </div>

      <TicketTipsCard />

      <div className="flex items-center justify-between pt-4">
        <CheckboxField
          id="urgentCallback"
          name="urgentCallback"
          checked={formData.urgentCallback}
          onChange={onChange}
          label="Request urgent callback (for high/urgent priority tickets)"
        />
        <button
          type="submit"
          className="bg-steel-blue text-white px-8 py-3 rounded-lg hover:bg-opacity-90 font-semibold transition-colors flex items-center"
        >
          Submit Ticket
          <Ticket className="ml-2 w-4 h-4" />
        </button>
      </div>
    </form>
  )
}

export default TicketSubmissionForm
