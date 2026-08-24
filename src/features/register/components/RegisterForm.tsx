"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"
import { showToast } from "@/components/ui/Toast"
import AddressSection from "@/features/register/components/AddressSection"
import CompanyInfoSection from "@/features/register/components/CompanyInfoSection"
import InviteTokenNotice from "@/features/register/components/InviteTokenNotice"
import PasswordSection from "@/features/register/components/PasswordSection"
import PersonalInfoFields from "@/features/register/components/PersonalInfoFields"
import RegisterFormActions from "@/features/register/components/RegisterFormActions"
import RegisterFormIntro from "@/features/register/components/RegisterFormIntro"
import { useRegisterForm } from "@/hooks/useRegisterForm"
import { useAuthStore } from "@/stores/authStore"

export default function RegisterForm() {
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get("email") ?? undefined
  const initialToken = searchParams.get("token") ?? undefined
  const initialRole = searchParams.get("role") === "TEAM_MEMBER" ? "TEAM_MEMBER" : undefined
  const isTokenFlow = !!initialToken
  const { logout, isAuthenticated } = useAuthStore()
  const {
    confirmPassword,
    errors,
    formData,
    inviteRole,
    tokenStatus,
    tokenErrorMessage,
    handleAddressFieldChange,
    handleAddressSelect,
    handleChange,
    handleCompanyFieldChange,
    handleCompanyPhoneNumberChange,
    handleConfirmPasswordChange,
    handlePhoneNumberChange,
    handlePostalCodeChange,
    handleSubmit,
    isLoading,
    submitErrorToken,
  } = useRegisterForm({ initialEmail, initialToken, initialRole })

  const showCompanyAndAddress = !isTokenFlow || inviteRole === "OWNER"

  const lastSubmitErrorTokenRef = useRef<number | null>(null)

  useEffect(() => {
    if (initialToken && isAuthenticated) {
      logout()
    }
  }, [initialToken, isAuthenticated, logout])

  useEffect(() => {
    if (errors.submit && submitErrorToken !== lastSubmitErrorTokenRef.current) {
      showToast.error(errors.submit)
      lastSubmitErrorTokenRef.current = submitErrorToken
    }
  }, [errors.submit, submitErrorToken])

  if (isTokenFlow && tokenStatus === "checking") {
    return (
      <div>
        <RegisterFormIntro />
        <p className="text-text-secondary">Checking your invitation link…</p>
      </div>
    )
  }

  if (isTokenFlow && tokenStatus === "invalid") {
    return (
      <div>
        <RegisterFormIntro />
        <InviteTokenNotice message={tokenErrorMessage} />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border-soft bg-surface-elevated p-6 shadow-panel sm:p-8 lg:p-12">
      <RegisterFormIntro />

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <PersonalInfoFields
            formData={formData}
            errors={errors}
            onChange={handleChange}
            onPhoneNumberChange={handlePhoneNumberChange}
            emailReadOnly={!!initialToken}
          />

          {showCompanyAndAddress && (
            <CompanyInfoSection
              company={formData.company}
              errors={errors}
              onFieldChange={handleCompanyFieldChange}
              onPhoneNumberChange={handleCompanyPhoneNumberChange}
            />
          )}

          {showCompanyAndAddress && (
            <AddressSection
              address={formData.address}
              errors={errors}
              onAddressSelect={handleAddressSelect}
              onAddressFieldChange={handleAddressFieldChange}
              onPostalCodeChange={handlePostalCodeChange}
            />
          )}

          <PasswordSection
            password={formData.password}
            confirmPassword={confirmPassword}
            errors={errors}
            onPasswordChange={handleChange}
            onConfirmPasswordChange={handleConfirmPasswordChange}
          />

          <RegisterFormActions isLoading={isLoading} />
        </div>
      </form>
    </div>
  )
}
