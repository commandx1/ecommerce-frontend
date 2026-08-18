import type { AutoOrderPeriod } from "@/lib/constants/auto-order"
import type { CartItem } from "@/stores/cartStore"

export interface CartTotals {
  subtotal: number
  shipmentFee: number
  heavyShipmentFee: number
  totalShipmentFee: number
  tax: number
  total: number
}

export interface CartSellerGroup {
  name: string
  items: CartItem[]
}

export interface CartItemCardProps {
  item: CartItem
  onAutoOrderChange: (userProductId: string, period: AutoOrderPeriod | null) => Promise<void>
  onQuantityChange: (userProductId: string, currentQuantity: number, delta: number) => void
  onRemoveItem: (userProductId: string) => void
}
