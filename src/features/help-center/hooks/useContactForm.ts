import type { ChangeEvent, FormEvent } from "react"
import { useCallback, useState } from "react"

import { showToast } from "@/components/ui/Toast"
import type { ContactFormData } from "@/features/help-center/types"

const INITIAL_CONTACT_FORM: ContactFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  subject: "",
  message: "",
  subscribe: false,
}

const REQUIRED_FIELDS: Array<keyof ContactFormData> = ["firstName", "lastName", "email", "subject", "message"]

const isBlank = (value: string) => value.trim().length === 0

export const useContactForm = () => {
  const [formData, setFormData] = useState<ContactFormData>(INITIAL_CONTACT_FORM)

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
        showToast.warning("Missing details", "Please complete all required fields before sending your message.")
        return
      }

      showToast.success("Message sent", "Our support team will reach out within 2 hours during business hours.")
      setFormData(INITIAL_CONTACT_FORM)
    },
    [formData],
  )

  return {
    formData,
    handleChange,
    handleSubmit,
  }
}
