"use client"

import { type ChangeEvent, type FormEvent, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { sendPasswordReset } from "@/features/forgot-password/services/requestPasswordReset"
import type { ForgotPasswordFormData } from "@/features/forgot-password/types"

export const useForgotPasswordForm = () => {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({ email: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setFormData({ email: value })
  }

  const handleResetRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formData.email) {
      showToast.warning("Email required", "Please enter your email address.")
      return
    }

    setIsSubmitting(true)

    try {
      await sendPasswordReset(formData.email)
      setIsSent(true)
      showToast.success("Reset email sent", "Password reset instructions have been sent to your email address.")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred. Please try again."
      showToast.error("Reset failed", message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendAgain = () => {
    setIsSent(false)
  }

  return {
    email: formData.email,
    isSubmitting,
    isSent,
    handleChange,
    handleResetRequest,
    handleSendAgain,
  }
}
