"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"
import { showToast } from "@/components/ui/Toast"
import AddressSection from "@/features/register/components/AddressSection"
import BusinessTypeField from "@/features/register/components/BusinessTypeField"
import CompanyInfoSection from "@/features/register/components/CompanyInfoSection"
import InviteTokenNotice from "@/features/register/components/InviteTokenNotice"
import PasswordSection from "@/features/register/components/PasswordSection"
import PersonalInfoFields from "@/features/register/components/PersonalInfoFields"
import RegisterFormActions from "@/features/register/components/RegisterFormActions"
import RegisterFormIntro from "@/features/register/components/RegisterFormIntro"
import { useRegisterForm } from "@/features/register/hooks/useRegisterForm"
import { useAuthStore } from "@/stores/authStore"

export default function RegisterForm() {
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get("email") ?? undefined
  const initialToken = searchParams.get("token") ?? undefined
  const initialRole = searchParams.get("role") === "TEAM_MEMBER" ? "TEAM_MEMBER" : undefined
  const isTokenFlow = !!initialToken
  const { clearLocalSession, isAuthenticated } = useAuthStore()
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
    handleSubmit,
    isLoading,
    submitErrorToken,
  } = useRegisterForm({ initialEmail, initialToken, initialRole })

  const showCompanyAndAddress = !isTokenFlow || inviteRole === "OWNER"
  const showCompanyInfo = isTokenFlow && inviteRole === "OWNER"

  const lastSubmitErrorTokenRef = useRef<number | null>(null)

  useEffect(() => {
    // This invite tab inherited another tab's session on load (shared cookie) - drop it locally
    // without revoking the server token or logging out sibling tabs.
    if (initialToken && isAuthenticated) {
      clearLocalSession()
    }
  }, [initialToken, isAuthenticated, clearLocalSession])

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

      {/* Radix Select (>= 2.3.1) mirrors its value into a hidden native `<select required>`, so
          without `noValidate` an unpicked required select (business type, shipment policy) would
          let the browser's own constraint validation block the submit before the zod-backed
          `validateForm` in `handleSubmit` ever runs. */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-6">
          <PersonalInfoFields
            formData={formData}
            errors={errors}
            onChange={handleChange}
            onPhoneNumberChange={handlePhoneNumberChange}
            emailReadOnly={!!initialToken}
          />

          {!isTokenFlow && (
            <BusinessTypeField
              value={formData.businessDescribe}
              error={errors.businessDescribe}
              onChange={handleChange}
            />
          )}

          {showCompanyInfo && (
            <CompanyInfoSection
              // Company info only renders for the token+OWNER flow, where formData.company is always initialized.
              company={formData.company as NonNullable<typeof formData.company>}
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
