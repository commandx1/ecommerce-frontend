import type { CartItem } from "@/lib/api/cart"

/**
 * Stable per-line signature (`userProductId:quantity`, comma-joined, in item order) for keying
 * the tax-estimate query on quantity as well as on which lines are present. Shared by the cart
 * page and checkout's order summary so a quantity change at an unchanged line count re-estimates
 * tax in both places (design doc §10.3, fixed - checkout used to key on `items.length` alone).
 */
export const cartLinesSignature = (items: Pick<CartItem, "userProduct" | "quantity">[]): string => {
  return items.map((item) => `${item.userProduct.userProductId}:${item.quantity}`).join(",")
}
