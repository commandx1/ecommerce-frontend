import type { License } from "@/lib/api/licenses"

export type DentalLicenseStatus = "valid" | "pending" | "expired" | "rejected" | "missing"

// `dentalLicenseRequired` is a free-form String column, written independently by the vendor
// dashboard and the admin panel (two separate codebases) with no backend enum constraining its
// casing or vocabulary. It has been observed as "Yes"/"No", "true"/"false" and "1"/"0" depending
// on which UI wrote it. A narrower check (e.g. only "yes") silently disables the gate for a
// product stored with one of the other spellings, so every known affirmative spelling is
// accepted here rather than guessed at per call site.
export const isDentalLicenseRequiredValue = (value: string | null | undefined): boolean => {
  // Runtime-guard the type too, not just at compile time: a malformed 200 (or a caller ignoring
  // the declared string type) can hand this a boolean/number, and `.trim()` on a non-string
  // throws — which would take down the whole cart/product render instead of just reading "false".
  if (typeof value !== "string") return false
  return ["true", "yes", "1"].includes(value.trim().toLowerCase())
}

// A buyer can hold several licences (e.g. a rejected DEA licence and a pending state licence).
// The precedence below picks the single most actionable status to show, ordered from "checkout
// already works" down to "nothing on file": a buyer who is already valid should never be told
// about an unrelated rejected licence, and a buyer with only a rejected licence should be told
// that (a concrete, fixable problem) rather than the generic "missing" copy.
export const resolveDentalLicenseStatus = (licenses: License[]): DentalLicenseStatus => {
  if (licenses.some((license) => license.approved === true && !license.expired)) {
    return "valid"
  }

  if (licenses.some((license) => license.approved === null && !license.expired)) {
    return "pending"
  }

  if (licenses.some((license) => license.approved === true && license.expired)) {
    return "expired"
  }

  if (licenses.some((license) => license.approved === false)) {
    return "rejected"
  }

  return "missing"
}

// Pulls the admin-authored rejection reason that drove a "rejected" status. Only meaningful
// alongside `resolveDentalLicenseStatus` returning "rejected" — a caller in any other status
// should not surface a stale reason from an unrelated licence.
export const getRejectionReason = (licenses: License[]): string | null => {
  const rejected = licenses.find((license) => license.approved === false)
  const reason = rejected?.rejectDescription?.trim()
  return reason ? reason : null
}
