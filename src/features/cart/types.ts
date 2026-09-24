import type { CartItem } from "@/lib/api/cart"
import type { AutoOrderPeriod } from "@/lib/constants/auto-order"

export interface CartTotals {
  subtotal: number
  shipmentFee: number
  heavyShipmentFee: number
  totalShipmentFee: number
  // null = not yet estimated (no address/items) or the estimate call failed — distinct from a
  // real $0 estimate the backend returned.
  tax: number | null
  total: number
}

export interface CartSellerGroup {
  name: string
  items: CartItem[]
}

export interface CartItemCardProps {
  item: CartItem
  requiresLicense: boolean
  isLicenseBlocked: boolean
  onAutoOrderChange: (userProductId: string, period: AutoOrderPeriod | null) => Promise<void>
  onQuantityChange: (userProductId: string, currentQuantity: number, delta: number) => void
  onRemoveItem: (userProductId: string) => void
}
