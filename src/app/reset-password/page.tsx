"use client"

import { Check, Eye, EyeOff, Key, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useId, useState } from "react"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const passwordInputId = useId()
  const confirmPasswordInputId = useId()

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token.")
      router.push("/forgot-password")
    }
  }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/mail/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to reset password.")
      }

      setIsSuccess(true)
      toast.success("Password updated successfully.")
      setTimeout(() => router.push("/login"), 3000)
    } catch (error) {
      toast.error((error as Error)?.message || "An error occurred while updating password.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-light-mint-gray flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-steel-blue mb-4">Password Updated Successfully!</h3>
          <p className="text-gray-600 mb-8">You can now sign in with your new password. Redirecting to login page...</p>
          <Link
            href="/login"
            className="inline-block w-full bg-steel-blue text-white py-4 px-6 rounded-xl hover:bg-opacity-90 font-semibold"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-mint-gray flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-light-mint-gray rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-steel-blue w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-steel-blue mb-3">Set New Password</h1>
          <p className="text-gray-600">Please enter a new and secure password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor={passwordInputId} className="block text-sm font-semibold text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id={passwordInputId}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                required
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              <Key className="absolute left-4 top-4 text-gray-400 w-6 h-6" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-400 hover:text-steel-blue"
              >
                {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor={confirmPasswordInputId} className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id={confirmPasswordInputId}
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                required
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              <Check className="absolute left-4 top-4 text-gray-400 w-6 h-6" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-steel-blue text-white py-4 px-6 rounded-xl hover:bg-opacity-90 font-semibold text-lg transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/login" className="text-gray-500 hover:text-steel-blue text-sm">
            Cancel and go back
          </Link>
        </div>
      </div>
    </div>
  )
}
