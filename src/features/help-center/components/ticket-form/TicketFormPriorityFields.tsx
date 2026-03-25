import type { ChangeEventHandler } from "react"
import { useId } from "react"

import { SelectField } from "@/components/form/SelectField"
import type { TicketFormData } from "@/features/help-center/types"

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low - General inquiry" },
  { value: "normal", label: "Normal - Standard support" },
  { value: "high", label: "High - Business impacting" },
  { value: "urgent", label: "Urgent - Critical issue" },
] as const

const CATEGORY_OPTIONS = [
  { value: "order-issue", label: "Order Issues" },
  { value: "product-defect", label: "Product Defect" },
  { value: "billing-dispute", label: "Billing Dispute" },
  { value: "account-access", label: "Account Access" },
  { value: "shipping-problem", label: "Shipping Problem" },
  { value: "website-bug", label: "Website Bug" },
  { value: "feature-request", label: "Feature Request" },
  { value: "partnership", label: "Partnership Inquiry" },
] as const

interface TicketFormPriorityFieldsProps {
  formData: TicketFormData
  onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
}

export default function TicketFormPriorityFields({ formData, onChange }: TicketFormPriorityFieldsProps) {
  const id = useId()

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <SelectField
        id={`${id}-priority`}
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
        id={`${id}-category`}
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
  )
}
