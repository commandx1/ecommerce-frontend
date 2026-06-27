"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
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
  const { logout, isAuthenticated } = useAuthStore()
  const {
    confirmPassword,
    errors,
    formData,
    handleAddressFieldChange,
    handleAddressSelect,
    handleChange,
    handleCompanyFieldChange,
    handleConfirmPasswordChange,
    handlePhoneNumberChange,
    handlePostalCodeChange,
    handleSubmit,
    isLoading,
  } = useRegisterForm({ initialEmail, initialToken })

  const lastSubmitErrorRef = useRef<string | null>(null)

  useEffect(() => {
    if (initialToken && isAuthenticated) {
      logout()
    }
  }, [initialToken, isAuthenticated, logout])

  useEffect(() => {
    if (errors.submit && errors.submit !== lastSubmitErrorRef.current) {
      showToast.error(errors.submit)
      lastSubmitErrorRef.current = errors.submit
    }
  }, [errors.submit])

  return (
    <div className="p-12">
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

          <CompanyInfoSection company={formData.company} errors={errors} onFieldChange={handleCompanyFieldChange} />

          <AddressSection
            address={formData.address}
            errors={errors}
            onAddressSelect={handleAddressSelect}
            onAddressFieldChange={handleAddressFieldChange}
            onPostalCodeChange={handlePostalCodeChange}
          />

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
