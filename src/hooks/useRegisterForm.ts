import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { z } from "zod"
import { showToast } from "@/components/ui/Toast"
import type { InviteRole } from "@/features/register/types"
import { authAPIDirect as authAPI, type CompanyPayload, type RegisterPayload } from "@/lib/api/auth-direct"
import type { ParsedAddress } from "@/lib/utils/google-maps"
import { normalizePhoneNumber } from "@/lib/utils/phone-number"
import { useAuthStore } from "@/stores/authStore"

const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).+$/
const PASSWORD_COMPLEXITY_MESSAGE =
  "Password must contain an uppercase letter, a lowercase letter, a number and a special character"

const VERIFY_EMAIL_AUTLOGIN_KEY = "verify_email_autologin_credentials"

const registerSchema = z
  .object({
    name: z.string().trim().min(1, "First name is required"),
    surname: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().min(1, "Email is required").email("Please enter a valid email address"),
    phoneNumber: z
      .string()
      .trim()
      .min(1, "Phone number is required")
      .refine((value) => /^\d{10}$/.test(value.replace(/\s/g, "")), "Please enter a valid 10-digit phone number"),
    password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
    address: z.object({
      title: z.string().optional(),
      fullName: z.string().optional(),
      phoneNumber: z.string().optional(),
      country: z.string().optional(),
      state: z.string().optional(),
      city: z.string().optional(),
      district: z.string().optional(),
      postalCode: z.string().min(1, "Zip code is required"),
      addressLine: z.string().optional(),
      defaultAddress: z.boolean().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      placeId: z.string().min(1, "Address is required"),
      formattedAddress: z.string().optional(),
    }),
    company: z.object({
      name: z.string().trim().min(1, "Company name is required"),
      taxNumber: z.string().trim().min(1, "Tax number is required"),
      email: z.string().trim().min(1, "Company email is required").email("Please enter a valid email address"),
      phoneNumber: z.string().trim().min(1, "Company phone is required"),
      website: z.string().optional(),
      description: z.string().optional(),
      companyPhoto: z.string().optional(),
      active: z.boolean().optional(),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

const initialFormData: RegisterPayload = {
  name: "",
  surname: "",
  email: "",
  password: "",
  phoneNumber: "",
  address: {
    title: "Business",
    fullName: "",
    phoneNumber: "",
    country: "",
    state: "",
    city: "",
    district: "",
    postalCode: "",
    addressLine: "",
    defaultAddress: true,
    latitude: 0,
    longitude: 0,
    placeId: "",
    formattedAddress: "",
  },
  company: {
    name: "",
    companyPhoto: "",
    taxNumber: "",
    email: "",
    phoneNumber: "",
    website: "",
    description: "",
    active: true,
  },
}

type ErrorMap = Record<string, string>

const capitalizeWords = (input: string) =>
  input
    .split(" ")
    .map((word) => (word ? word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase() : word))
    .join(" ")

const mapZodErrors = (errors: z.ZodIssue[]) => {
  const fieldErrors: ErrorMap = {}

  for (const issue of errors) {
    const path = issue.path.join(".")

    if (path === "address.placeId") {
      fieldErrors.address = issue.message
      continue
    }
    if (path === "address.postalCode") {
      fieldErrors.addressPostalCode = issue.message
      continue
    }
    if (path === "company.name") {
      fieldErrors.companyName = issue.message
      continue
    }
    if (path === "company.email") {
      fieldErrors.companyEmail = issue.message
      continue
    }
    if (path === "company.phoneNumber") {
      fieldErrors.companyPhoneNumber = issue.message
      continue
    }
    if (path === "company.taxNumber") {
      fieldErrors.taxNumber = issue.message
      continue
    }

    const fieldKey = issue.path[0]
    if (fieldKey) {
      fieldErrors[String(fieldKey)] = issue.message
    }
  }

  return fieldErrors
}

const inviteBaseFields = {
  name: z.string().trim().min(1, "First name is required"),
  surname: z.string().trim().min(1, "Last name is required"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine((value) => /^\d{10}$/.test(value.replace(/\s/g, "")), "Please enter a valid 10-digit phone number"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .regex(PASSWORD_COMPLEXITY_REGEX, PASSWORD_COMPLEXITY_MESSAGE),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}

const ownerInviteSchema = z
  .object({
    ...inviteBaseFields,
    address: z.object({
      postalCode: z.string().min(1, "Zip code is required"),
      placeId: z.string().min(1, "Address is required"),
    }),
    company: z.object({
      name: z.string().trim().min(1, "Company name is required"),
      taxNumber: z.string().trim().min(1, "Tax number is required"),
      email: z.string().trim().min(1, "Company email is required").email("Please enter a valid email address"),
      phoneNumber: z.string().trim().min(1, "Company phone is required"),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

const teamMemberInviteSchema = z
  .object({
    ...inviteBaseFields,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

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
  const [tokenStatus, setTokenStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle")
  const [tokenErrorMessage, setTokenErrorMessage] = useState<string | undefined>(undefined)

  const initialToken = options?.initialToken

  useEffect(() => {
    if (!initialToken) {
      return
    }

    let cancelled = false
    setTokenStatus("checking")

    authAPI
      .validateSignupToken(initialToken)
      .then(() => {
        if (!cancelled) {
          setTokenStatus("valid")
        }
      })
      .catch(() => {
        if (cancelled) return
        setTokenErrorMessage(
          "This invitation link is no longer valid. Please ask the person who invited you for a new one.",
        )
        setTokenStatus("invalid")
      })

    return () => {
      cancelled = true
    }
  }, [initialToken])

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
          const fullName = `${formData.name} ${formData.surname}`.trim()
          await authAPI.completeVendorInviteRegister({
            token: options?.initialToken ?? "",
            name: formData.name,
            surname: formData.surname,
            phoneNumber: normalizePhoneNumber(formData.phoneNumber),
            password: formData.password,
            address: {
              ...formData.address,
              fullName: fullName || formData.address.fullName,
              phoneNumber: normalizePhoneNumber(formData.phoneNumber),
            },
            company: formData.company,
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

      const fullName = `${formData.name} ${formData.surname}`.trim()

      await authAPI.register({
        ...formData,
        address: {
          ...formData.address,
          city: formData.address.state,
          fullName: fullName || formData.address.fullName,
        },
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
          setTokenErrorMessage(
            "This invitation link is no longer valid. Please ask the person who invited you for a new one.",
          )
          setTokenStatus("invalid")
          return
        }
      }

      const knownFieldKeys = [
        "name",
        "surname",
        "email",
        "phoneNumber",
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
        ...prev.company,
        [field]: value,
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
        ...prev.company,
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
