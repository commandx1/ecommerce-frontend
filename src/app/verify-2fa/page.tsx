"use client"

import { ArrowLeft, Loader2, Lock, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/authStore"
import { verifyTwoFactorLogin } from "@/lib/api/two-factor"

function Verify2FAContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const { setAuth } = useAuthStore()

  const [code, setCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!email) {
      toast.error("Email is missing. Please log in again.")
      router.push("/login")
    }
  }, [email, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (code.length < 6) {
      toast.error("Please enter the 6-digit code.")
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
      toast.error((error as Error).message || "Verification failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-light-mint-gray flex items-center justify-center p-4 font-inter">
      <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-light-mint-gray rounded-full flex items-center justify-center mx-auto mb-6 text-steel-blue">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-steel-blue mb-3">Two-Factor Authentication</h1>
          <p className="text-gray-600">
            We've sent a 6-digit verification code to <br />
            <span className="font-semibold text-gray-900">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
              Verification Code
            </label>
            <div className="relative">
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent text-center text-2xl tracking-[0.5em] font-bold text-steel-blue"
                placeholder="000000"
                required
                maxLength={6}
                disabled={isSubmitting}
              />
              <Lock className="absolute left-4 top-5 text-gray-400 w-6 h-6" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-steel-blue text-white py-4 px-6 rounded-xl hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue font-semibold text-lg transition-all flex items-center justify-center disabled:opacity-50"
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
          <p className="text-sm text-gray-500">
            Didn't receive the code?{" "}
            <button type="button" className="text-steel-blue font-semibold hover:underline">
              Resend Code
            </button>
          </p>
          <Link href="/login" className="flex items-center justify-center text-sm text-gray-500 hover:text-steel-blue">
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
        <div className="min-h-screen bg-light-mint-gray flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-steel-blue animate-spin" />
        </div>
      }
    >
      <Verify2FAContent />
    </Suspense>
  )
}
