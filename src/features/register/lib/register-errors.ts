import type { z } from "zod"

export type ErrorMap = Record<string, string>

/** "john" -> "John", "MARY ann" -> "Mary Ann" - first/last name fields are stored capitalized. */
export function capitalizeWords(input: string): string {
  return input
    .split(" ")
    .map((word) => (word ? word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase() : word))
    .join(" ")
}

/**
 * Flattens zod's nested `address.*`/`company.*` issue paths to the flat field-name keys the
 * register form's inputs key their error messages off (`addressPostalCode`, `companyName`,
 * `companyEmail`, `companyPhoneNumber`, `taxNumber`, `shipmentPolicy`, or the top-level field
 * name for everything else).
 */
export function mapZodErrors(errors: z.ZodIssue[]): ErrorMap {
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
    if (path === "company.shipmentPolicy") {
      fieldErrors.shipmentPolicy = issue.message
      continue
    }

    const fieldKey = issue.path[0]
    if (fieldKey) {
      fieldErrors[String(fieldKey)] = issue.message
    }
  }

  return fieldErrors
}
