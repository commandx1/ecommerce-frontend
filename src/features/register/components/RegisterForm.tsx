"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"
import { showToast } from "@/components/ui/Toast"
import AddressSection from "@/features/register/components/AddressSection"
import CompanyInfoSection from "@/features/register/components/CompanyInfoSection"
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
      <div className="p-6 sm:p-8 lg:p-12">
        <RegisterFormIntro />
        <p className="text-text-secondary">Checking your invitation link…</p>
      </div>
    )
  }

  if (isTokenFlow && tokenStatus === "invalid") {
    return (
      <div className="p-6 sm:p-8 lg:p-12">
        <RegisterFormIntro />
        <p className="text-text-secondary">
          {tokenErrorMessage ??
            "This invitation link is no longer valid. Please ask the person who invited you for a new one."}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-primary-foreground transition-colors hover:bg-brand-strong"
        >
          Go to login
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 lg:p-12">
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
