/**
 * Business type constants for user registration
 * These values are used in the registration form and sent to the backend
 */
export const BUSINESS_TYPES = {
  PERSONAL_CUSTOMER: "Personal_Customer",
  DENTAL_SERVICE_INDUSTRY: "Dental_Service_Industry",
} as const

/**
 * Business type labels for display in the UI
 */
export const BUSINESS_TYPE_LABELS: Record<typeof BUSINESS_TYPES[keyof typeof BUSINESS_TYPES], string> = {
  [BUSINESS_TYPES.PERSONAL_CUSTOMER]: "Personal Customer",
  [BUSINESS_TYPES.DENTAL_SERVICE_INDUSTRY]: "Dental Service Industry",
}

/**
 * Array of business types for easy iteration (e.g., in select options)
 */
export const BUSINESS_TYPE_OPTIONS = [
  {
    value: BUSINESS_TYPES.PERSONAL_CUSTOMER,
    label: BUSINESS_TYPE_LABELS[BUSINESS_TYPES.PERSONAL_CUSTOMER],
  },
  {
    value: BUSINESS_TYPES.DENTAL_SERVICE_INDUSTRY,
    label: BUSINESS_TYPE_LABELS[BUSINESS_TYPES.DENTAL_SERVICE_INDUSTRY],
  },
] as const

/**
 * Type for business describe values
 */
export type BusinessType = typeof BUSINESS_TYPES[keyof typeof BUSINESS_TYPES]

