"use client"

import type { ChangeEvent } from "react"
import ThemeToggle from "@/components/theme/ThemeToggle"
import ForgotPasswordForm from "@/features/forgot-password/components/ForgotPasswordForm"
import ForgotPasswordInfoPanel from "@/features/forgot-password/components/ForgotPasswordInfoPanel"
import ForgotPasswordSuccess from "@/features/forgot-password/components/ForgotPasswordSuccess"
import { useForgotPasswordForm } from "@/features/forgot-password/hooks/useForgotPasswordForm"

export default function ForgotPasswordContent() {
  const { email, isSubmitting, isSent, handleChange, handleResetRequest, handleSendAgain } = useForgotPasswordForm()

  if (isSent) {
    return <ForgotPasswordSuccess email={email} onSendAgain={handleSendAgain} />
  }

  return (
    <div className="min-h-screen bg-canvas font-sans">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <section className="flex min-h-screen flex-col items-center justify-center py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-border-soft bg-surface-elevated shadow-panel">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <ForgotPasswordForm
                email={email}
                isSubmitting={isSubmitting}
                onEmailChange={(value) =>
                  handleChange({ target: { name: "email", value } } as ChangeEvent<HTMLInputElement>)
                }
                onSubmit={handleResetRequest}
              />
              <ForgotPasswordInfoPanel />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
