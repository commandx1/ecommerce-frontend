import { useRouter } from "next/navigation"
import { useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { useSignupTokenStatus } from "@/features/register/hooks/useSignupTokenStatus"
import { capitalizeWords, type ErrorMap, mapZodErrors } from "@/features/register/lib/register-errors"
import { buildAddressPayload, initialFormData } from "@/features/register/lib/register-payload"
import { ownerInviteSchema, registerSchema, teamMemberInviteSchema } from "@/features/register/lib/register-schemas"
import type { InviteRole } from "@/features/register/types"
import { authAPIDirect as authAPI, type CompanyPayload, type RegisterPayload } from "@/lib/api/auth-direct"
import type { ParsedAddress } from "@/lib/utils/google-maps"
import { normalizePhoneNumber } from "@/lib/utils/phone-number"
import { useAuthStore } from "@/stores/authStore"

const VERIFY_EMAIL_AUTLOGIN_KEY = "verify_email_autologin_credentials"

export const useRegisterForm = (options?: {
  initialEmail?: string
  initialToken?: string
  initialRole?: InviteRole
}) => {
  const router = useRouter()
  const { setError } = useAuthStore()
  const isTokenFlow = !!options?.initialToken

  const [formData, setFormData] = useState<RegisterPayload>(() => ({
    ...initialFormData,
    email: options?.initialEmail ?? "",
  }))
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ErrorMap>({})
  const [submitErrorToken, setSubmitErrorToken] = useState(0)
  // The invite role is not user-selectable: it is implied by the link the invitee arrived from.
  // Admin invites land on /register (company owner), company invites on /vendor-manager-add (team member).
  const inviteRole: InviteRole = options?.initialRole ?? "OWNER"
  const { tokenStatus, tokenErrorMessage, markInvalid } = useSignupTokenStatus(options?.initialToken)

  const clearError = (key: string) => {
    if (!errors[key]) return
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const validateForm = () => {
    const schema = isTokenFlow ? (inviteRole === "OWNER" ? ownerInviteSchema : teamMemberInviteSchema) : registerSchema
    const result = schema.safeParse({ ...formData, confirmPassword })

    if (result.success) {
      setErrors({})
      return true
    }

    setErrors(mapZodErrors(result.error.issues))
    return false
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (isTokenFlow) {
        if (inviteRole === "OWNER") {
          await authAPI.completeVendorInviteRegister({
            token: options?.initialToken ?? "",
            name: formData.name,
            surname: formData.surname,
            phoneNumber: normalizePhoneNumber(formData.phoneNumber),
            password: formData.password,
            address: buildAddressPayload(formData),
            // Company info is only collected in the token+OWNER flow, where formData.company is always initialized.
            company: formData.company as CompanyPayload,
          })
        } else {
          await authAPI.completeVendorManagerAdd({
            token: options?.initialToken ?? "",
            name: formData.name,
            surname: formData.surname,
            phoneNumber: normalizePhoneNumber(formData.phoneNumber),
            password: formData.password,
          })
        }
        showToast.love("Welcome to DentzPro!", "Thank you for registering with us — we're thrilled to have you!")
        router.push(`/login?email=${encodeURIComponent(formData.email)}`)
        return
      }

      const { company: _company, ...registerFields } = formData

      await authAPI.register({
        ...registerFields,
        address: buildAddressPayload(formData),
      })
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          VERIFY_EMAIL_AUTLOGIN_KEY,
          JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        )
      }
      showToast.love("Welcome to DentzPro!", "Thank you for registering with us — we're thrilled to have you!")
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch (error: unknown) {
      const err = error as { message?: string; data?: unknown }
      const errorData = err.data

      if (isTokenFlow && err.message) {
        if (err.message.includes("This invitation is for company managers")) {
          setErrors({
            submit:
              "This invitation is for joining an existing company, but this page sets up a new one. Please open the link from your invitation email, or ask the person who invited you to resend it.",
          })
          setSubmitErrorToken((token) => token + 1)
          return
        }

        if (err.message.includes("Vendor owners cannot complete manager registration")) {
          setErrors({
            submit:
              "This invitation is for setting up a new company. Please open the link from your invitation email, or ask the person who invited you to resend it.",
          })
          setSubmitErrorToken((token) => token + 1)
          return
        }

        if (err.message.includes("Company name already exists")) {
          setErrors({ companyName: err.message })
          return
        }

        if (
          err.message.includes("Invalid signup token") ||
          err.message.includes("already been used") ||
          err.message.includes("is expired")
        ) {
          markInvalid()
          return
        }
      }

      const knownFieldKeys = [
        "name",
        "surname",
        "email",
        "phoneNumber",
        "businessDescribe",
        "address",
        "addressPostalCode",
        "password",
        "confirmPassword",
        "companyName",
        "companyEmail",
        "companyPhoneNumber",
        "taxNumber",
      ]

      if (errorData && typeof errorData === "object") {
        const fieldError = Object.entries(errorData).find(
          ([key, value]) => knownFieldKeys.includes(key) && typeof value === "string" && value.trim(),
        )

        if (fieldError) {
          setErrors({ [fieldError[0]]: fieldError[1] as string })
          return
        }
      }

      if (err.message) {
        setErrors({ submit: err.message })
        setSubmitErrorToken((token) => token + 1)
        return
      }

      setErrors({ submit: "An error occurred during registration" })
      setSubmitErrorToken((token) => token + 1)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    const normalizedValue = name === "name" || name === "surname" ? capitalizeWords(value) : value

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: normalizedValue,
      }

      if (name === "name" || name === "surname") {
        updated.address = {
          ...updated.address,
          fullName: `${updated.name} ${updated.surname}`.trim() || updated.address.fullName,
        }
      }

      return updated
    })

    clearError(name)
    clearError("submit")
  }

  const handlePhoneNumberChange = (value: string) => {
    const normalizedPhoneNumber = normalizePhoneNumber(value)

    setFormData((prev) => ({
      ...prev,
      phoneNumber: normalizedPhoneNumber,
      address: {
        ...prev.address,
        phoneNumber: normalizedPhoneNumber,
      },
    }))
    clearError("phoneNumber")
    clearError("submit")
  }

  const handleAddressFieldChange = (field: keyof RegisterPayload["address"], value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }))
  }

  const handleCompanyFieldChange = (field: keyof CompanyPayload, value: string) => {
    setFormData((prev) => ({
      ...prev,
      company: {
        ...(prev.company as CompanyPayload),
        [field]: value as CompanyPayload[typeof field],
      },
    }))
    clearError(
      field === "name"
        ? "companyName"
        : field === "email"
          ? "companyEmail"
          : field === "phoneNumber"
            ? "companyPhoneNumber"
            : field,
    )
    clearError("submit")
  }

  const handleCompanyPhoneNumberChange = (value: string) => {
    const normalizedPhoneNumber = normalizePhoneNumber(value)

    setFormData((prev) => ({
      ...prev,
      company: {
        ...(prev.company as CompanyPayload),
        phoneNumber: normalizedPhoneNumber,
      },
    }))
    clearError("companyPhoneNumber")
    clearError("submit")
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    clearError("confirmPassword")
    clearError("submit")
  }

  const handleAddressSelect = (parsedAddress: ParsedAddress) => {
    const fullName = `${formData.name} ${formData.surname}`.trim()
    setFormData((prev) => ({
      ...prev,
      address: {
        title: "Business",
        fullName: fullName || prev.address.fullName,
        phoneNumber: prev.phoneNumber,
        country: parsedAddress.country,
        state: parsedAddress.state,
        city: parsedAddress.city,
        district: parsedAddress.district,
        postalCode: parsedAddress.postalCode,
        addressLine: parsedAddress.addressLine,
        defaultAddress: true,
        latitude: parsedAddress.latitude,
        longitude: parsedAddress.longitude,
        placeId: parsedAddress.placeId,
        formattedAddress: parsedAddress.formattedAddress,
      },
    }))
    clearError("address")
    clearError("submit")
  }

  const handlePostalCodeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, postalCode: value },
    }))
    clearError("addressPostalCode")
    clearError("submit")
  }

  return {
    confirmPassword,
    errors,
    formData,
    isLoading,
    submitErrorToken,
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
  }
}
