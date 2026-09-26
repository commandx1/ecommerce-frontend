"use client"

import TicketFormAttachmentField from "@/features/help-center/components/ticket-form/TicketFormAttachmentField"
import TicketFormCoreFields from "@/features/help-center/components/ticket-form/TicketFormCoreFields"
import TicketFormPriorityFields from "@/features/help-center/components/ticket-form/TicketFormPriorityFields"
import TicketFormSubmitActions from "@/features/help-center/components/ticket-form/TicketFormSubmitActions"
import { useTicketForm } from "@/features/help-center/hooks/useTicketForm"

const TicketSubmissionForm = () => {
  const { formData, handleChange, handleSubmit } = useTicketForm()

  return (
    // Radix Select (>= 2.3.1) mirrors its value into a hidden native `<select required>`, so
    // without `noValidate` an unpicked required select would let the browser's own constraint
    // validation block the submit before `handleSubmit` (and its toast) ever runs.
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <TicketFormPriorityFields formData={formData} onChange={handleChange} />
      <TicketFormCoreFields formData={formData} onChange={handleChange} />
      <TicketFormAttachmentField />
      <TicketFormSubmitActions isUrgentCallback={formData.urgentCallback} onChange={handleChange} />
    </form>
  )
}

export default TicketSubmissionForm
