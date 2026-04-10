"use client"

import ThemeToggle from "@/components/theme/ThemeToggle"
import ResetPasswordCard from "@/features/reset-password/components/ResetPasswordCard"
import ResetPasswordSuccess from "@/features/reset-password/components/ResetPasswordSuccess"
import { useResetPasswordForm } from "@/features/reset-password/hooks/useResetPasswordForm"

export default function ResetPasswordContent() {
  const { formData, isSubmitting, isSuccess, handleChange, handleSubmit } = useResetPasswordForm()

  if (isSuccess) {
    return <ResetPasswordSuccess />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <ResetPasswordCard
        password={formData.password}
        confirmPassword={formData.confirmPassword}
        isSubmitting={isSubmitting}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
