import { useRouter } from "next/navigation"
import { useState } from "react"
import { z } from "zod"
import { authAPIDirect as authAPI, type RegisterPayload } from "@/lib/api/auth-direct"
import type { ParsedAddress } from "@/lib/utils/google-maps"
import { normalizePhoneNumber } from "@/lib/utils/phone-number"
import { useAuthStore } from "@/stores/authStore"

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
    businessDescribe: z.string().min(1, "Business type is required"),
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
  businessDescribe: "",
  address: {
    title: "Home",
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

    const fieldKey = issue.path[0]
    if (fieldKey) {
      fieldErrors[String(fieldKey)] = issue.message
    }
  }

  return fieldErrors
}

export const useRegisterForm = () => {
  const router = useRouter()
  const { setError } = useAuthStore()

  const [formData, setFormData] = useState<RegisterPayload>(initialFormData)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ErrorMap>({})

  const clearError = (key: string) => {
    if (!errors[key]) return
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const validateForm = () => {
    const result = registerSchema.safeParse({ ...formData, confirmPassword })

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
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
    } catch (error: unknown) {
      const err = error as { message?: string; data?: unknown }
      const errorData = err.data

      if (errorData && typeof errorData === "object") {
        const fieldError = Object.entries(errorData).find(
          ([key, value]) => key !== "message" && typeof value === "string" && value.trim(),
        )

        if (fieldError) {
          setErrors({ [fieldError[0]]: fieldError[1] as string })
          return
        }
      }

      if (err.message) {
        setErrors({ submit: err.message })
        return
      }

      setErrors({ submit: "An error occurred during registration" })
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
        title: "Home",
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
    handleAddressFieldChange,
    handleAddressSelect,
    handleChange,
    handleConfirmPasswordChange,
    handlePhoneNumberChange,
    handlePostalCodeChange,
    handleSubmit,
  }
}
