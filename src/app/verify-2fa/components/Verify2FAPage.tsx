"use client"

import { ArrowLeft, ShieldCheck } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import Logo from "@/app/components/Logo"
import { authAPIDirect as authAPI, type Verify2FAPayload } from "@/lib/api/auth-direct"
import { useAuthStore } from "@/stores/authStore"

function Verify2FAPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const { setUser, setTokens } = useAuthStore()

  const digitPositions = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"] as const
  const [code, setCode] = useState(["", "", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    const numValue = value.replace(/[^0-9]/g, "")

    if (numValue.length <= 1) {
      const newCode = [...code]
      newCode[index] = numValue
      setCode(newCode)

      // Auto-focus next input
      if (numValue && index < 6) {
        inputRefs.current[index + 1]?.focus()
      }

      if (error) setError("")
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    // Handle paste
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      return // Allow paste
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, 7)

    if (pastedData) {
      const newCode = [...code]
      for (let i = 0; i < pastedData.length && i < 7; i++) {
        newCode[i] = pastedData[i]
      }
      setCode(newCode)

      // Focus last filled input or the input after last character
      const focusIndex = Math.min(pastedData.length, 6)
      inputRefs.current[focusIndex]?.focus()
    }
  }

  const getFullCode = () => code.join("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const fullCode = getFullCode()

    if (!email) {
      setError("Email address is missing. Please try logging in again.")
      return
    }

    if (fullCode.length !== 7) {
      setError("Please enter the complete 7-digit verification code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const payload: Verify2FAPayload = {
        email,
        code: fullCode,
        device: "windows",
      }

      // biome-ignore lint/suspicious/noExplicitAny: Response type includes dynamic fields from backend
      const response: any = await authAPI.verify2FA(payload)

      // Save tokens
      if (response.accessToken && response.refreshToken) {
        setTokens(response.accessToken, response.refreshToken)
      }

      // Save user data
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
      }
      setUser(userData)

      // Redirect to home page
      router.push("/")
    } catch (error: unknown) {
      const err = error as { message?: string }
      if (err.message?.includes("expired")) {
        setError("Verification code has expired. Please request a new one.")
      } else if (err.message?.includes("invalid") || err.message?.includes("Invalid")) {
        setError("Invalid verification code. Please try again.")
      } else {
        setError(err.message || "An error occurred during verification")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    // This would typically call an API to resend the 2FA code
    // For now, redirect back to login
    router.push("/login")
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-light-mint-gray font-inter">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button type="button" className="flex items-center cursor-pointer" onClick={() => router.push("/")}>
                <Logo />
                <span className="ml-3 text-2xl font-bold text-steel-blue">DentyPro</span>
              </button>
            </div>
          </div>
        </header>

        <section className="py-12">
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-12 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="text-red-600 w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold text-steel-blue mb-4">Session Expired</h1>
              <p className="text-gray-600 mb-8">
                Your session has expired or the email address is missing. Please try logging in again.
              </p>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full bg-steel-blue text-white py-4 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-mint-gray font-inter">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button type="button" className="flex items-center cursor-pointer" onClick={() => router.push("/")}>
              <Logo />
              <span className="ml-3 text-2xl font-bold text-steel-blue">DentyPro</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="text-white w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-steel-blue mb-3">Two-Factor Authentication</h1>
              <p className="text-gray-600">
                Enter the 7-digit verification code sent to <span className="font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <fieldset>
                  <legend className="block text-sm font-medium text-gray-700 mb-4 text-center">
                    Verification Code
                  </legend>
                  <div className="flex justify-center gap-2">
                    {code.map((digit, index) => (
                      <input
                        key={`code-digit-${digitPositions[index]}`}
                        id={`code-digit-${digitPositions[index]}`}
                        ref={(el) => {
                          inputRefs.current[index] = el
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        aria-label={`Digit ${index + 1}`}
                        className="w-11 h-14 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                      />
                    ))}
                  </div>
                </fieldset>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || getFullCode().length !== 7}
                  className="w-full bg-steel-blue text-white py-4 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Verifying..." : "Verify & Sign In"}
                </button>

                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">Didn't receive the code?</p>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-steel-blue font-medium hover:underline text-sm"
                  >
                    Resend code
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full flex items-center justify-center text-steel-blue hover:underline"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

const Verify2FAPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-light-mint-gray font-inter">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <Logo />
                  <span className="ml-3 text-2xl font-bold text-steel-blue">DentyPro</span>
                </div>
              </div>
            </div>
          </header>
          <section className="py-12">
            <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-12 text-center">
                <div className="w-16 h-16 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="text-white w-8 h-8 animate-pulse" />
                </div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          </section>
        </div>
      }
    >
      <Verify2FAPageContent />
    </Suspense>
  )
}

export default Verify2FAPage
