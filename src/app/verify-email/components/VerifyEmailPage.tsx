"use client"

import { ArrowLeft, Mail } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
// import { authAPI } from "@/lib/api/auth"
import { authAPIDirect as authAPI } from "@/lib/api/auth-direct"

function VerifyEmailPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code || code.length !== 6) {
      setError("Please enter the 6-digit verification code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await authAPI.verifyEmail({ email, code })
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error: unknown) {
      const err = error as { message?: string }
      setError(err.message || "An error occurred during verification")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6)
    setCode(value)
    if (error) setError("")
  }

  return (
    <div className="min-h-screen bg-light-mint-gray font-inter flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-steel-blue mb-3">Email Verification</h1>
            <p className="text-gray-600">
              Enter the 6-digit verification code sent to <span className="font-medium">{email}</span>
            </p>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-green-600 text-lg font-semibold mb-2">✓ Email Verified!</div>
              <p className="text-green-700 text-sm">Redirecting to login page...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent text-center text-2xl font-bold tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
                {error && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full bg-steel-blue text-white py-4 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {isLoading ? "Verifying..." : "Verify Email"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/register")}
                className="w-full flex items-center justify-center text-steel-blue hover:underline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to registration
              </button>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-gray-600 text-sm text-center">
              Didn't receive the code?{" "}
              <button type="button" className="text-steel-blue font-medium hover:underline">
                Resend code
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const VerifyEmailPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-light-mint-gray font-inter flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-12 text-center">
              <div className="w-16 h-16 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-white w-8 h-8 animate-pulse" />
              </div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  )
}

export default VerifyEmailPage
