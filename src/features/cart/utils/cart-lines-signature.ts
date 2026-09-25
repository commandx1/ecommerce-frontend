import type { CartItem } from "@/lib/api/cart"

/**
 * Per-line signature (`userProductId:quantity`, in item order) for keying the tax-estimate query,
 * so a quantity change at an unchanged line count re-estimates tax (cart page and checkout).
 */
export const cartLinesSignature = (items: Pick<CartItem, "userProduct" | "quantity">[]): string => {
  return items.map((item) => `${item.userProduct.userProductId}:${item.quantity}`).join(",")
}
