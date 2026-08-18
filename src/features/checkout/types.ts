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
}

export interface SellerGroup {
  name: string
  items: SellerGroupItem[]
}

export interface PaymentMethodOption {
  type: "card" | "net30" | "wire" | "financing"
  title: string
  description?: string
  badge?: {
    label: string
    className: string
  }
  icon: "card" | "file" | "bank" | "finance"
}

export interface CheckoutProgressStep {
  number: 1 | 2 | 3 | 4 | 5
  title: string
  subtitle: string
}
