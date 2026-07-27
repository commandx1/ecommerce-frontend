"use client"

import { ArrowLeft, Loader2, Lock, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useId, useState } from "react"
import ThemeToggle from "@/components/theme/ThemeToggle"
import { showToast } from "@/components/ui/Toast"
import { verifyTwoFactorLogin } from "@/lib/api/two-factor"
import { useAuthStore } from "@/stores/authStore"

function Verify2FAContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const { setAuth } = useAuthStore()

  const [code, setCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const codeInputId = useId()

  useEffect(() => {
    if (!email) {
      showToast.error("Email is missing. Please log in again.")
      router.push("/login")
    }
  }, [email, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (code.length < 6) {
      showToast.error("Please enter the 6-digit code.")
      return
    }

    setIsSubmitting(true)

    try {
      if (!email) {
        throw new Error("Email is missing. Please log in again.")
      }

      const data = await verifyTwoFactorLogin({
        email,
        code,
        device: "windows",
      })

      // Atomic update for both user and tokens to ensure correct cookie persistence
      if (data.accessToken && data.refreshToken) {
        setAuth(
          {
            id: data.id,
            name: data.name,
            surname: data.surname,
            email: data.email,
            phoneNumber: data.phoneNumber,
            emailConfirmed: data.emailConfirmed,
            phoneNumberConfirmed: data.phoneNumberConfirmed,
            twoFactorEnabled: data.twoFactorEnabled,
            lockoutEnd: data.lockoutEnd,
            createdDate: data.createdDate,
            roleName: data.roleName,
          },
          data.accessToken,
          data.refreshToken,
        )
      } else {
        throw new Error("Authentication tokens are missing from response.")
      }

      router.refresh()
      router.push("/")
    } catch (error) {
      showToast.error((error as Error).message || "Verification failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4 font-inter">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-3xl bg-surface-elevated p-6 shadow-2xl sm:p-8 lg:p-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-surface-muted rounded-full flex items-center justify-center mx-auto mb-6 text-brand">
            <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand mb-3">Two-Factor Authentication</h1>
          <p className="text-text-secondary">
            We've sent a 6-digit verification code to <br />
            <span className="font-semibold text-text-primary">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor={codeInputId} className="block text-sm font-semibold text-text-primary mb-2">
              Verification Code
            </label>
            <div className="relative">
              <input
                type="text"
                id={codeInputId}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full pl-12 pr-4 py-4 border border-border-soft rounded-xl bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-center text-xl sm:text-2xl tracking-[0.4em] sm:tracking-[0.5em] font-bold text-brand"
                placeholder="000000"
                required
                maxLength={6}
                disabled={isSubmitting}
              />
              <Lock className="absolute left-4 top-5 text-text-secondary w-6 h-6" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand text-primary-foreground py-4 px-6 rounded-xl hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand font-semibold text-lg transition-all flex items-center justify-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-text-secondary">
            Didn't receive the code?{" "}
            <button type="button" className="text-brand font-semibold hover:underline">
              Resend Code
            </button>
          </p>
          <Link href="/login" className="flex items-center justify-center text-sm text-text-secondary hover:text-brand">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Verify2FAPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
        </div>
      }
    >
      <Verify2FAContent />
    </Suspense>
  )
}
