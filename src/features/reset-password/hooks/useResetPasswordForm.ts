"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { submitPasswordReset } from "@/features/reset-password/services/resetPassword"
import type { ResetPasswordFormData } from "@/features/reset-password/types"

const MIN_PASSWORD_LENGTH = 8
const LOGIN_REDIRECT_DELAY = 3000

export const useResetPasswordForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: "",
    confirmPassword: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasNotifiedInvalidTokenRef = useRef(false)

  useEffect(() => {
    if (!token && !hasNotifiedInvalidTokenRef.current) {
      showToast.error("Invalid token", "Your password reset link is missing or expired.")
      hasNotifiedInvalidTokenRef.current = true
      router.push("/forgot-password")
    }
  }, [router, token])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validate = () => {
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      showToast.warning("Weak password", `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`)
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      showToast.error("Passwords do not match", "Please make sure both passwords are the same.")
      return false
    }

    return true
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) {
      showToast.error("Invalid token", "Please request a new password reset link.")
      router.push("/forgot-password")
      return
    }

    if (!validate()) {
      return
    }

    setIsSubmitting(true)

    try {
      await submitPasswordReset(token, formData.password)
      setIsSuccess(true)
      showToast.success("Password updated", "You can now sign in with your new password.")
      redirectTimeoutRef.current = setTimeout(() => {
        router.push("/login")
      }, LOGIN_REDIRECT_DELAY)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred while updating password."
      showToast.error("Update failed", message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    isSubmitting,
    isSuccess,
    handleChange,
    handleSubmit,
  }
}
