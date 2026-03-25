import type { ChangeEventHandler } from "react"
import { useId } from "react"

import { TextField } from "@/components/form/TextField"
import TicketDescriptionField from "@/features/help-center/components/TicketDescriptionField"
import TicketTipsCard from "@/features/help-center/components/TicketTipsCard"
import type { TicketFormData } from "@/features/help-center/types"

interface TicketFormCoreFieldsProps {
  formData: TicketFormData
  onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
}

export default function TicketFormCoreFields({ formData, onChange }: TicketFormCoreFieldsProps) {
  const id = useId()

  return (
    <>
      <TextField
        id={`${id}-orderNumber`}
        name="orderNumber"
        type="text"
        label="Order Number (if applicable)"
        value={formData.orderNumber}
        onChange={onChange}
        placeholder="e.g., DH-2024-001234"
      />

      <TextField
        id={`${id}-title`}
        name="title"
        type="text"
        label="Ticket Title"
        value={formData.title}
        onChange={onChange}
        placeholder="Brief description of your issue"
        required
      />

      <TicketDescriptionField textareaId={`${id}-description`} value={formData.description} onChange={onChange} />
      <TicketTipsCard />
    </>
  )
}
