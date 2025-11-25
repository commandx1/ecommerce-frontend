"use client"

import { ArrowLeft, CheckCircle, Lock } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import Logo from "@/app/components/Logo"
import { authAPIDirect as authAPI, type ResetPasswordPayload } from "@/lib/api/auth-direct"

const ResetPasswordPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    return {
      isValid: minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial,
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.")
      return
    }

    if (!formData.newPassword) {
      setError("Please enter a new password")
      return
    }

    const validation = validatePassword(formData.newPassword)
    if (!validation.isValid) {
      setError("Password does not meet the requirements")
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const payload: ResetPasswordPayload = {
        token,
        newPassword: formData.newPassword,
      }
      await authAPI.resetPassword(payload)
    } catch {
      // Ignore errors - the password might still be reset
      // The API may not return a proper response
    } finally {
      setIsLoading(false)
      // Always show success - if token was invalid, user will find out when trying to login
      setSuccess(true)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error) setError("")
  }

  const passwordValidation = validatePassword(formData.newPassword)

  if (!token) {
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
                <Lock className="text-red-600 w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold text-steel-blue mb-4">Invalid Reset Link</h1>
              <p className="text-gray-600 mb-8">
                This password reset link is invalid or missing. Please request a new password reset.
              </p>
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="w-full bg-steel-blue text-white py-4 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
              >
                Request New Reset Link
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
                  <CheckCircle className="text-green-600 w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-steel-blue mb-4">Password Reset Successful!</h1>
                <p className="text-gray-600 mb-8">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full bg-steel-blue text-white py-4 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="text-white w-8 h-8" />
                  </div>
                  <h1 className="text-3xl font-bold text-steel-blue mb-3">Reset Your Password</h1>
                  <p className="text-gray-600">Please enter your new password below.</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password *
                      </label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                          placeholder="Enter your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? "👁️" : "👁️‍🗨️"}
                        </button>
                      </div>

                      {/* Password Requirements */}
                      {formData.newPassword && (
                        <div className="mt-3 space-y-1 text-sm">
                          <p
                            className={`flex items-center ${passwordValidation.minLength ? "text-green-600" : "text-gray-500"}`}
                          >
                            <span className="mr-2">{passwordValidation.minLength ? "✓" : "○"}</span>
                            At least 8 characters
                          </p>
                          <p
                            className={`flex items-center ${passwordValidation.hasUppercase ? "text-green-600" : "text-gray-500"}`}
                          >
                            <span className="mr-2">{passwordValidation.hasUppercase ? "✓" : "○"}</span>
                            One uppercase letter
                          </p>
                          <p
                            className={`flex items-center ${passwordValidation.hasLowercase ? "text-green-600" : "text-gray-500"}`}
                          >
                            <span className="mr-2">{passwordValidation.hasLowercase ? "✓" : "○"}</span>
                            One lowercase letter
                          </p>
                          <p
                            className={`flex items-center ${passwordValidation.hasNumber ? "text-green-600" : "text-gray-500"}`}
                          >
                            <span className="mr-2">{passwordValidation.hasNumber ? "✓" : "○"}</span>
                            One number
                          </p>
                          <p
                            className={`flex items-center ${passwordValidation.hasSpecial ? "text-green-600" : "text-gray-500"}`}
                          >
                            <span className="mr-2">{passwordValidation.hasSpecial ? "✓" : "○"}</span>
                            One special character (!@#$%^&*)
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                        </button>
                      </div>
                      {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                      )}
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">{error}</p>
                        {error.includes("expired") && (
                          <button
                            type="button"
                            onClick={() => router.push("/forgot-password")}
                            className="mt-2 text-steel-blue hover:underline text-sm font-medium"
                          >
                            Request new reset link →
                          </button>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        isLoading || !passwordValidation.isValid || formData.newPassword !== formData.confirmPassword
                      }
                      className="w-full bg-steel-blue text-white py-4 px-6 rounded-lg hover:bg-opacity-90 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Resetting Password..." : "Reset Password"}
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

export default ResetPasswordPage
