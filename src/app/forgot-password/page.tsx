"use client"

import { Check, Headset, Info, Key, Mail, SendIcon, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useId, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { requestPasswordReset } from "@/lib/api/password-recovery"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const emailInputId = useId()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await requestPasswordReset(email)
      setIsSent(true)
      showToast.success("Password reset instructions have been sent to your email address.")
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : "An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSent) {
    return (
      <div className="min-h-screen bg-light-mint-gray flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-steel-blue mb-4">Reset Link Sent!</h3>
          <p className="text-gray-600 mb-6">
            We've sent password reset instructions to <strong>{email}</strong>. Please check your inbox and follow the
            instructions.
          </p>
          <div className="bg-light-mint-gray rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600">
              <Info className="inline-block w-4 h-4 text-steel-blue mr-2" />
              The reset link is valid for 24 hours for security reasons.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsSent(false)}
            className="w-full bg-steel-blue text-white py-4 px-6 rounded-xl hover:bg-opacity-90 font-semibold"
          >
            Send Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="font-inter bg-light-mint-gray min-h-screen">
      <section className="py-16 bg-light-mint-gray min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Information Panel */}
            <div className="hidden lg:block">
              <div className="bg-linear-to-br from-steel-blue to-blue-800 rounded-3xl p-12 text-white h-full">
                <div className="mb-8">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                    <ShieldCheck className="text-pale-lime w-8 h-8" />
                  </div>
                  <h2 className="text-4xl font-bold mb-4">Secure Password Recovery</h2>
                  <p className="text-blue-100 text-lg leading-relaxed">
                    We take the security of your data seriously. Our password recovery process ensures only you can
                    access your account.
                  </p>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      title: "Email Verification",
                      desc: "We'll send a secure reset link to your registered email address.",
                    },
                    {
                      title: "Time-Limited Access",
                      desc: "Reset links expire after 24 hours for maximum security.",
                    },
                    {
                      title: "Account Protection",
                      desc: "Your data and order history remain fully protected.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-pale-lime rounded-full flex items-center justify-center shrink-0 mt-1">
                        <Check className="text-steel-blue w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-blue-100 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-pale-lime rounded-xl flex items-center justify-center">
                      <Headset className="text-steel-blue w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Need Help?</h3>
                      <p className="text-blue-100 text-sm">Contact our support team at support@dentypro.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Reset Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-light-mint-gray rounded-full flex items-center justify-center mx-auto mb-6">
                    <Key className="text-steel-blue w-8 h-8" />
                  </div>
                  <h1 className="text-3xl font-bold text-steel-blue mb-3">Reset Your Password</h1>
                  <p className="text-gray-600 text-lg">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor={emailInputId} className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id={emailInputId}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your registered email address"
                        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent text-gray-900 placeholder-gray-500"
                        required
                        disabled={isSubmitting}
                      />
                      <Mail className="absolute left-4 top-4 text-gray-400 w-6 h-6" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-steel-blue text-white py-4 px-6 rounded-xl hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-steel-blue font-semibold text-lg transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {isSubmitting ? "Sending..." : "Send Reset Instructions"}
                    <SendIcon className="ml-2 w-5 h-5" />
                  </button>
                </form>

                <div className="mt-8 p-6 bg-light-mint-gray rounded-2xl">
                  <div className="flex items-start space-x-3">
                    <Info className="text-steel-blue mt-1 w-5 h-5" />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">Can't find the email?</p>
                      <p>Check your spam folder or contact our support team.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <p className="text-gray-600">
                    Remember your password?{" "}
                    <Link href="/login" className="text-steel-blue hover:text-blue-700 font-semibold hover:underline">
                      Sign In
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
