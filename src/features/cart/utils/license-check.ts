import type { License } from "@/lib/api/licenses"
import type { CartItem } from "@/stores/cartStore"

export const cartRequiresDentalLicense = (items: CartItem[]): boolean => {
  return items.some((item) => item.product.dentalLicenseRequired === "Yes")
}

export const hasValidDentalLicense = (licenses: License[]): boolean => {
  return licenses.some((license) => license.approved === true && !license.expired)
}
