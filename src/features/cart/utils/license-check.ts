import type { CartItem } from "@/lib/api/cart"
import type { License } from "@/lib/api/licenses"
import { isDentalLicenseRequiredValue, resolveDentalLicenseStatus } from "@/lib/helpers/dentalLicense"

export const cartRequiresDentalLicense = (items: CartItem[]): boolean => {
  return items.some((item) => isDentalLicenseRequiredValue(item.product.dentalLicenseRequired))
}

export const hasValidDentalLicense = (licenses: License[]): boolean => {
  return resolveDentalLicenseStatus(licenses) === "valid"
}
