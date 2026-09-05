import type { License } from "@/lib/api/licenses"
import { isDentalLicenseRequiredValue, resolveDentalLicenseStatus } from "@/lib/helpers/dentalLicense"
import type { CartItem } from "@/stores/cartStore"

export const cartRequiresDentalLicense = (items: CartItem[]): boolean => {
  return items.some((item) => isDentalLicenseRequiredValue(item.product.dentalLicenseRequired))
}

export const hasValidDentalLicense = (licenses: License[]): boolean => {
  return resolveDentalLicenseStatus(licenses) === "valid"
}
