interface VendorOption {
  id: string
}

/**
 * The supplier picker stores the selected vendor in the `?vendorId` query param, but the value it
 * holds is the vendor's `UserProduct.id` (their listing for this product). Only accept it when it
 * matches one of the product's actual listings, so a stale or hand-edited URL falls back to "all".
 */
export function resolveSelectedUserProductId(
  vendorIdFromUrl: string | null,
  userProducts: VendorOption[],
): string | undefined {
  if (!vendorIdFromUrl) return undefined
  return userProducts.some((userProduct) => userProduct.id === vendorIdFromUrl) ? vendorIdFromUrl : undefined
}
