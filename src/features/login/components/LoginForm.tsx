"use client"

import LoginFormActions from "@/features/login/components/LoginFormActions"
import LoginFormFields from "@/features/login/components/LoginFormFields"
import LoginFormIntro from "@/features/login/components/LoginFormIntro"
import LoginFormOptions from "@/features/login/components/LoginFormOptions"
import { useLoginForm } from "@/features/login/hooks/useLoginForm"

export default function LoginForm() {
  const {
    formData,
    isFormValid,
    isLoading,
    rememberMe,
    handleChange,
    handleForgotPassword,
    handleRememberMeChange,
    handleSubmit,
  } = useLoginForm()

  return (
    <div className="p-12">
      <LoginFormIntro />

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <LoginFormFields formData={formData} onChange={handleChange} isSubmitting={isLoading} />
          <LoginFormOptions
            rememberMe={rememberMe}
            onRememberMeChange={handleRememberMeChange}
            onForgotPassword={handleForgotPassword}
            isSubmitting={isLoading}
          />
          <LoginFormActions isSubmitting={isLoading} isFormValid={isFormValid} />
        </div>
      </form>
    </div>
  )
}
