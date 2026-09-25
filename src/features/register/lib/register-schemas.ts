import { z } from "zod"

export const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).+$/
export const PASSWORD_COMPLEXITY_MESSAGE =
  "Password must contain an uppercase letter, a lowercase letter, a number and a special character"

/** The self-serve /register flow: full personal + address + company details, no invite token. */
export const registerSchema = z
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
    businessDescribe: z.string().min(1, "Business type is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

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

/** Admin-invited signup (lands on /register?token=..., inviteRole "OWNER"): sets up a new company. */
export const ownerInviteSchema = z
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
      // Same 10-digit rule as the personal phone above. `normalizePhoneNumber` deliberately no
      // longer truncates (F52: silently dropping digits produces a different, valid-looking
      // number that fails at delivery time), so the length bound has to live here - otherwise a
      // 15-digit entry is accepted and stored as-is.
      phoneNumber: z
        .string()
        .trim()
        .min(1, "Company phone is required")
        .refine((value) => /^\d{10}$/.test(value.replace(/\s/g, "")), "Please enter a valid 10-digit phone number"),
      shipmentPolicy: z.string().min(1, "Shipment policy is required"),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

/** Company-invited signup (lands on /vendor-manager-add?token=..., inviteRole "MEMBER"/"MANAGER"):
 * joins an existing company, so no address/company fields are collected here. */
export const teamMemberInviteSchema = z
  .object({
    ...inviteBaseFields,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
