import type { ChangeEvent, FormEvent } from "react"
import { useCallback, useState } from "react"

import { showToast } from "@/components/ui/Toast"

export interface ContactSupportFormData {
  firstName: string
  lastName: string
  email: string
  topic: string
  message: string
}

const INITIAL_FORM_DATA: ContactSupportFormData = {
  firstName: "",
  lastName: "",
  email: "",
  topic: "",
  message: "",
}

const REQUIRED_FIELDS: Array<keyof ContactSupportFormData> = ["email", "topic", "message"]

const isBlank = (value: string) => value.trim().length === 0

export const useContactSupportForm = () => {
  const [formData, setFormData] = useState<ContactSupportFormData>(INITIAL_FORM_DATA)

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const hasMissingFields = REQUIRED_FIELDS.some((field) => isBlank(formData[field]))
      if (hasMissingFields) {
        showToast.warning("Missing details", "Please complete the required fields before submitting.")
        return
      }

      showToast.success("Request received", "Our legal team will contact you shortly.")
      setFormData(INITIAL_FORM_DATA)
    },
    [formData],
  )

  return {
    formData,
    handleChange,
    handleSubmit,
  }
}
