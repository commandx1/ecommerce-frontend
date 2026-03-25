"use client"

import TicketFormAttachmentField from "@/features/help-center/components/ticket-form/TicketFormAttachmentField"
import TicketFormCoreFields from "@/features/help-center/components/ticket-form/TicketFormCoreFields"
import TicketFormPriorityFields from "@/features/help-center/components/ticket-form/TicketFormPriorityFields"
import TicketFormSubmitActions from "@/features/help-center/components/ticket-form/TicketFormSubmitActions"
import { useTicketForm } from "@/features/help-center/hooks/useTicketForm"

const TicketSubmissionForm = () => {
  const { formData, handleChange, handleSubmit } = useTicketForm()

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <TicketFormPriorityFields formData={formData} onChange={handleChange} />
      <TicketFormCoreFields formData={formData} onChange={handleChange} />
      <TicketFormAttachmentField />
      <TicketFormSubmitActions isUrgentCallback={formData.urgentCallback} onChange={handleChange} />
    </form>
  )
}

export default TicketSubmissionForm
