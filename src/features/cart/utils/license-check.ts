import type { License } from "@/lib/api/licenses"
import type { CartItem } from "@/stores/cartStore"

// `dentalLicenseRequired` is a free-form string field set independently by the vendor
// dashboard and the admin panel (two separate codebases), with no backend enum
// constraining its casing. A case-sensitive `=== "Yes"` comparison silently treats any
// other casing (e.g. "yes", "YES") as "no license required", bypassing the license gate
// entirely for a product that actually needs one. Comparing case-insensitively (and
// trimming incidental whitespace) closes that gap without weakening the check for
// genuinely non-"yes" values (booleans, null, undefined, empty string all still fail).
const isAffirmative = (value: unknown): boolean => typeof value === "string" && value.trim().toLowerCase() === "yes"

export const cartRequiresDentalLicense = (items: CartItem[]): boolean => {
  return items.some((item) => isAffirmative(item.product.dentalLicenseRequired))
}

export const hasValidDentalLicense = (licenses: License[]): boolean => {
  return licenses.some((license) => license.approved === true && !license.expired)
}
