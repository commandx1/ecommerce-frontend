import type { ChangeEvent, FormEvent } from "react"
import { useCallback, useState } from "react"

import { showToast } from "@/components/ui/Toast"

export interface TicketFormData {
  priority: string
  category: string
  orderNumber: string
  title: string
  description: string
  urgentCallback: boolean
}

const INITIAL_TICKET_FORM: TicketFormData = {
  priority: "",
  category: "",
  orderNumber: "",
  title: "",
  description: "",
  urgentCallback: false,
}

const REQUIRED_FIELDS: Array<keyof TicketFormData> = ["priority", "category", "title", "description"]

const isBlank = (value: string) => value.trim().length === 0

export const useTicketForm = () => {
  const [formData, setFormData] = useState<TicketFormData>(INITIAL_TICKET_FORM)

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = event.target as HTMLInputElement
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }))
  }, [])

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const missingFields = REQUIRED_FIELDS.filter((field) => isBlank(String(formData[field] ?? "")))
      if (missingFields.length > 0) {
        showToast.warning("Missing details", "Please complete all required fields before submitting your ticket.")
        return
      }

      showToast.success("Ticket submitted", "Your request has been received and will be reviewed shortly.")
      setFormData(INITIAL_TICKET_FORM)
    },
    [formData],
  )

  return {
    formData,
    handleChange,
    handleSubmit,
  }
}
