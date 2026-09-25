"use client"

import VerifyEmailFooter from "@/features/verify-email/components/VerifyEmailFooter"
import VerifyEmailForm from "@/features/verify-email/components/VerifyEmailForm"
import VerifyEmailHeader from "@/features/verify-email/components/VerifyEmailHeader"
import { useVerifyEmailForm } from "@/features/verify-email/hooks/useVerifyEmailForm"

export default function VerifyEmailContent() {
  const {
    code,
    email,
    isCodeComplete,
    isSubmitting,
    submitLabel,
    handleCodeChange,
    handleBackToRegister,
    handleResendCode,
    handleSubmit,
  } = useVerifyEmailForm()

  return (
    <div className="overflow-hidden rounded-3xl bg-surface-elevated p-6 shadow-2xl sm:p-8 lg:p-12">
      <VerifyEmailHeader email={email} />
      <VerifyEmailForm
        code={code}
        isCodeComplete={isCodeComplete}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
        onCodeChange={handleCodeChange}
        onSubmit={handleSubmit}
        onBackToRegister={handleBackToRegister}
      />
      <VerifyEmailFooter onResendCode={handleResendCode} />
    </div>
  )
}
