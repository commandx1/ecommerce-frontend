import type { CartItem } from "@/lib/api/cart"

/**
 * Single source of truth for the key checkout groups a cart line's shipping selection under.
 * Mirrors the inline logic `useShippingDetails` used to compute `sellerGroups` by: a real
 * `sellerId` wins, otherwise fall back to the seller's display name, otherwise "Standard Seller"
 * for a line that carries neither. `useCheckoutCartSync` needs the exact same key to tell which
 * entries of `selectedVendorShippingMethods` are still backed by a cart line.
 */
export function getSellerGroupKey(item: CartItem): string {
  return item.userProduct.sellerId || item.userProduct.sellerName || "Standard Seller"
}
