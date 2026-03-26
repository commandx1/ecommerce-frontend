"use client"

import type { ChangeEvent } from "react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
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
    <div className="font-inter bg-light-mint-gray min-h-screen">
      <PageSectionContainer as="section" className="py-16 bg-light-mint-gray min-h-screen flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          <ForgotPasswordInfoPanel />
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <ForgotPasswordForm
              email={email}
              isSubmitting={isSubmitting}
              onEmailChange={(value) =>
                handleChange({ target: { name: "email", value } } as ChangeEvent<HTMLInputElement>)
              }
              onSubmit={handleResetRequest}
            />
          </div>
        </div>
      </PageSectionContainer>
    </div>
  )
}
