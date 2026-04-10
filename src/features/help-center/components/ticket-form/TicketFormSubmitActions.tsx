import { Ticket } from "lucide-react"
import type { ChangeEventHandler } from "react"
import { useId } from "react"

import { CheckboxField } from "@/components/form/CheckboxField"

interface TicketFormSubmitActionsProps {
  isUrgentCallback: boolean
  onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
}

export default function TicketFormSubmitActions({ isUrgentCallback, onChange }: TicketFormSubmitActionsProps) {
  const id = useId()

  return (
    <div className="flex items-center justify-between pt-4">
      <CheckboxField
        id={`${id}-urgentCallback`}
        name="urgentCallback"
        checked={isUrgentCallback}
        onChange={onChange}
        label="Request urgent callback (for high/urgent priority tickets)"
      />
      <button
        type="submit"
        className="flex items-center rounded-full bg-brand px-8 py-3 font-semibold text-primary-foreground transition-colors hover:bg-brand-strong"
      >
        Submit Ticket
        <Ticket className="ml-2 h-4 w-4" />
      </button>
    </div>
  )
}
