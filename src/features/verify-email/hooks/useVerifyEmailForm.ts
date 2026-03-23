"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { verifyEmail } from "@/features/verify-email/services/verifyEmail"

const CODE_LENGTH = 6

export const useVerifyEmailForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const handleCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH)
    setCode(value)
  }

  const validate = () => {
    if (code.length !== CODE_LENGTH) {
      showToast.warning("Invalid code", "Please enter the 6-digit verification code.")
      return false
    }

    return true
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    setIsLoading(true)

    try {
      await verifyEmail({ email, code })
      showToast.success("Email verified", "Redirecting you to the login page.")
      setIsRedirecting(true)
      redirectTimeoutRef.current = setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error: unknown) {
      const err = error as { message?: string }
      showToast.error("Verification failed", err.message || "An error occurred during verification.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = () => {
    showToast.info("Resend code", "Please check your inbox or try again in a few minutes.")
  }

  const handleBackToRegister = () => {
    router.push("/register")
  }

  const isSubmitting = isLoading || isRedirecting
  const isCodeComplete = code.length === CODE_LENGTH
  const submitLabel = isRedirecting ? "Redirecting..." : isLoading ? "Verifying..." : "Verify Email"

  return {
    code,
    email,
    isCodeComplete,
    isSubmitting,
    submitLabel,
    handleCodeChange,
    handleBackToRegister,
    handleResendCode,
    handleSubmit,
  }
}
