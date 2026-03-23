"use client"

import { type ChangeEvent, type FormEvent, useState } from "react"
import { showToast } from "@/components/ui/Toast"

export const useNewsletterSignup = () => {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email) {
      showToast.warning("Email required", "Please enter your email address.")
      return
    }

    setIsSubmitting(true)

    try {
      showToast.success("Subscription confirmed", "You are now subscribed to the newsletter.")
      setEmail("")
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    email,
    isSubmitting,
    handleChange,
    handleSubmit,
  }
}
