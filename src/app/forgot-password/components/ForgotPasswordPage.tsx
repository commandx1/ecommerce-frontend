"use client"

import { ArrowLeft, Mail, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Logo from "@/app/components/Logo"
import { authAPIDirect as authAPI, type ForgotPasswordPayload } from "@/lib/api/auth-direct"

const ForgotPasswordPage = () => {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const payload: ForgotPasswordPayload = { email }
      await authAPI.forgotPassword(payload)
    } catch {
      // Ignore errors - we'll show success regardless
      // This is because the API may not return a proper response
      // but the email might still be sent
    } finally {
      setIsLoading(false)
      // Always show success to prevent email enumeration attacks
      // and because the API response may not be reliable
      setSuccess(true)
    }
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
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Remember your password?</span>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="bg-steel-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 font-medium"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-12">
            {success ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="text-green-600 w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-steel-blue mb-4">Check Your Email</h1>
                <p className="text-gray-600 mb-6">
                  We've sent a password reset link to <span className="font-medium">{email}</span>
                </p>
                <p className="text-gray-500 text-sm mb-8">
                  If you don't see the email, check your spam folder. The link will expire in 3 minutes.
                </p>
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="w-full bg-steel-blue text-white py-4 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSuccess(false)
                      setEmail("")
                    }}
                    className="w-full text-steel-blue hover:underline font-medium"
                  >
                    Try a different email
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="text-white w-8 h-8" />
                  </div>
                  <h1 className="text-3xl font-bold text-steel-blue mb-3">Forgot Password?</h1>
                  <p className="text-gray-600">
                    No worries! Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (error) setError("")
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                        placeholder="professional@example.com"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-steel-blue text-white py-4 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Sending..." : "Send Reset Link"}
                    </button>

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
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default ForgotPasswordPage
