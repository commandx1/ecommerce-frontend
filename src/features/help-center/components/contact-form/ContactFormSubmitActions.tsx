import { Send } from "lucide-react"
import type { ChangeEventHandler } from "react"
import { useId } from "react"

import { CheckboxField } from "@/components/form/CheckboxField"

interface ContactFormSubmitActionsProps {
  isSubscribed: boolean
  onChange: ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
}

export default function ContactFormSubmitActions({ isSubscribed, onChange }: ContactFormSubmitActionsProps) {
  const id = useId()

  return (
    <>
      <CheckboxField
        id={`${id}-newsletter`}
        name="subscribe"
        checked={isSubscribed}
        onChange={onChange}
        label="Subscribe to our newsletter for updates and exclusive offers"
      />

      <button
        type="submit"
        className="flex w-full items-center justify-center rounded-full bg-brand px-6 py-4 text-lg font-semibold text-primary-foreground transition-colors hover:bg-brand-strong"
      >
        Send Message
        <Send className="ml-2 h-5 w-5" />
      </button>
    </>
  )
}
