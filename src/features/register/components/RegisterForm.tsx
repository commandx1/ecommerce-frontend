"use client"

import { useEffect, useRef } from "react"
import { useRegisterForm } from "@/hooks/useRegisterForm"
import { showToast } from "@/components/ui/Toast"
import AddressSection from "@/features/register/components/AddressSection"
import BusinessTypeField from "@/features/register/components/BusinessTypeField"
import PasswordSection from "@/features/register/components/PasswordSection"
import PersonalInfoFields from "@/features/register/components/PersonalInfoFields"
import RegisterFormActions from "@/features/register/components/RegisterFormActions"
import RegisterFormIntro from "@/features/register/components/RegisterFormIntro"

export default function RegisterForm() {
  const {
    confirmPassword,
    errors,
    formData,
    handleAddressFieldChange,
    handleAddressSelect,
    handleChange,
    handleConfirmPasswordChange,
    handlePhoneNumberChange,
    handlePostalCodeChange,
    handleSubmit,
    isLoading,
  } = useRegisterForm()

  const lastSubmitErrorRef = useRef<string | null>(null)

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
          />

          <BusinessTypeField
            value={formData.businessDescribe}
            onChange={handleChange}
            error={errors.businessDescribe}
          />

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
