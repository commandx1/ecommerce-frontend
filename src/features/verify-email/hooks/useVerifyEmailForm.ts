"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { login } from "@/features/login/services/login"
import { authAPIDirect } from "@/lib/api/auth-direct"
import {
  clearVerifyEmailAutologinCredentials,
  readVerifyEmailAutologinCredentials,
} from "@/lib/storage/verify-email-autologin"
import { useAuthStore } from "@/stores/authStore"

const CODE_LENGTH = 6
const DEVICE_NAME = "windows"

export const useVerifyEmailForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const { setError } = useAuthStore()

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
    setError(null)

    try {
      await authAPIDirect.verifyEmail({ email, code })

      const credentials = readVerifyEmailAutologinCredentials()

      if (credentials && credentials.email === email) {
        try {
          const response = await login({
            email: credentials.email,
            password: credentials.password,
            device: DEVICE_NAME,
          })

          const userData = {
            id: response.id,
            name: response.name,
            surname: response.surname,
            email: response.email,
            phoneNumber: response.phoneNumber,
            emailConfirmed: response.emailConfirmed,
            phoneNumberConfirmed: response.phoneNumberConfirmed,
            twoFactorEnabled: response.twoFactorEnabled,
            lockoutEnd: response.lockoutEnd,
            createdDate: response.createdDate,
            roleName: response.roleName,
          }

          if (response.accessToken && response.refreshToken) {
            const { setAuth } = useAuthStore.getState()
            // Session-only cookie: this is a fresh, un-opted-in sign-in - the shopper never saw
            // a "Keep me signed in" checkbox during registration.
            setAuth(userData, response.accessToken, response.refreshToken)
          } else {
            const { setUser } = useAuthStore.getState()
            setUser(userData)
          }

          clearVerifyEmailAutologinCredentials()
          showToast.success("Email verified", "You are now signed in.")
          router.refresh()
          router.push("/")
          return
        } catch {
          // Fallback to login redirect if auto-login fails
        } finally {
          clearVerifyEmailAutologinCredentials()
        }
      }

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
