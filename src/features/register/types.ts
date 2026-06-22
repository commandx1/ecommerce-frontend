import type { RegisterPayload } from "@/lib/api/auth-direct"
import type { ParsedAddress } from "@/lib/utils/google-maps"

export interface RegisterFormErrors {
  name?: string
  surname?: string
  email?: string
  phoneNumber?: string
  address?: string
  addressPostalCode?: string
  password?: string
  confirmPassword?: string
  submit?: string
  companyName?: string
  companyEmail?: string
  companyPhoneNumber?: string
  taxNumber?: string
}

export type RegisterFormData = RegisterPayload
export type RegisterAddress = RegisterPayload["address"]
export type { ParsedAddress }
