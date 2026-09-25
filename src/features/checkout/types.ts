import type { ShipmentRate, UberQuote } from "@/lib/api/shipment"
import type { AutoOrderPeriod } from "@/lib/constants/auto-order"

export type ShippingRate = ShipmentRate | UberQuote

export interface SellerGroupItem {
  userProductId: string
  productId: string
  name: string
  quantity: number
  /** Carried over from the cart item; null for a one-off purchase. */
  autoOrder: AutoOrderPeriod | null
  /** Per-unit product shipment fee (heavy surcharge excluded), carried over from the cart item. */
  shipmentFee: number
}

export interface SellerGroup {
  name: string
  /**
   * The cart line's raw `userProduct.sellerId`, kept separate from the grouping key (which falls
   * back to the seller name) so the order payload never sends a non-UUID `userId`.
   */
  sellerId: string
  items: SellerGroupItem[]
}

export interface CheckoutProgressStep {
  number: 1 | 2 | 3 | 4 | 5
  title: string
  subtitle: string
}
