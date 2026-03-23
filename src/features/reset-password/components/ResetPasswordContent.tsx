"use client"

import ResetPasswordCard from "@/features/reset-password/components/ResetPasswordCard"
import ResetPasswordSuccess from "@/features/reset-password/components/ResetPasswordSuccess"
import { useResetPasswordForm } from "@/features/reset-password/hooks/useResetPasswordForm"

export default function ResetPasswordContent() {
  const { formData, isSubmitting, isSuccess, handleChange, handleSubmit } = useResetPasswordForm()

  if (isSuccess) {
    return <ResetPasswordSuccess />
  }

  return (
    <div className="min-h-screen bg-light-mint-gray flex items-center justify-center p-4">
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
