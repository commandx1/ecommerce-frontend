import type { CartItem } from "@/lib/api/cart"

/**
 * The key checkout groups a cart line's shipping selection under: the real `sellerId`, else the
 * seller's display name, else "Standard Seller". Shared by `useShippingDetails` and `useCheckoutCartSync`.
 */
export function getSellerGroupKey(item: CartItem): string {
  return item.userProduct.sellerId || item.userProduct.sellerName || "Standard Seller"
}
