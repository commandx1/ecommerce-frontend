"use client"

import VerifyEmailCard from "@/features/verify-email/components/VerifyEmailCard"
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
    <VerifyEmailCard>
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
    </VerifyEmailCard>
  )
}
