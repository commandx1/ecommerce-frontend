"use client"

import { useRouter } from "next/navigation"
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { login } from "@/features/login/services/login"
import type { LoginFormData } from "@/features/login/types"
import { useAuthStore } from "@/stores/authStore"

const REMEMBER_ME_EMAIL_KEY = "remembered_email"
const REMEMBER_ME_PASSWORD_KEY = "remembered_password"
const DEVICE_NAME = "windows"

export const useLoginForm = () => {
  const router = useRouter()
  const { setUser, setError } = useAuthStore()

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const rememberedEmail = localStorage.getItem(REMEMBER_ME_EMAIL_KEY)
    const rememberedPassword = localStorage.getItem(REMEMBER_ME_PASSWORD_KEY)

    setFormData({
      email: rememberedEmail || "",
      password: rememberedPassword || "",
    })

    setRememberMe(Boolean(rememberedEmail || rememberedPassword))
  }, [])

  const isFormValid = useMemo(() => formData.email.length > 0 && formData.password.length > 0, [formData])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRememberMeChange = (value: boolean) => {
    setRememberMe(value)
  }

  const handleForgotPassword = () => {
    router.push("/forgot-password")
  }

  const handleSignUp = () => {
    router.push("/register")
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isFormValid) {
      showToast.warning("Missing details", "Please enter your email and password.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await login({
        ...formData,
        device: DEVICE_NAME,
      })

      if (response.twoFactorRequired || response.requires2FA || response.twoFactorEnabled) {
        showToast.info("Two-factor required", response.message || "2FA code has been sent to your email.")
        router.push(`/verify-2fa?email=${encodeURIComponent(formData.email)}`)
        return
      }

      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_EMAIL_KEY, formData.email)
        localStorage.setItem(REMEMBER_ME_PASSWORD_KEY, formData.password)
      } else {
        localStorage.removeItem(REMEMBER_ME_EMAIL_KEY)
        localStorage.removeItem(REMEMBER_ME_PASSWORD_KEY)
      }

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
        setAuth(userData, response.accessToken, response.refreshToken)
      } else {
        setUser(userData)
      }

      router.refresh()
      router.push("/")
    } catch (error: unknown) {
      const err = error as { message?: string; requires2FA?: boolean }

      if (err.requires2FA || err.message?.includes("2FA") || err.message?.includes("two-factor")) {
        showToast.info("Two-factor required", "We sent a verification code to your email.")
        router.push(`/verify-2fa?email=${encodeURIComponent(formData.email)}`)
        return
      }

      if (
        err.message?.includes("Email not verified") ||
        (err.message?.includes("email") && err.message?.includes("verified")) ||
        err.message?.toLowerCase().includes("email doğrulanmamış")
      ) {
        showToast.error("Email not verified", "Redirecting you to verification.")
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
        return
      }

      if (err.message?.includes("Account is Temporarily locked") || err.message?.includes("locked")) {
        showToast.error("Account locked", "Your account is temporarily locked. Please try again later.")
        return
      }

      if (err.message?.includes("Invalid email or password") || err.message?.includes("Invalid")) {
        showToast.error("Invalid credentials", "Please check your email and password and try again.")
        return
      }

      showToast.error("Sign-in failed", err.message || "An error occurred during sign in.")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    formData,
    isFormValid,
    isLoading,
    rememberMe,
    handleChange,
    handleForgotPassword,
    handleRememberMeChange,
    handleSignUp,
    handleSubmit,
  }
}
