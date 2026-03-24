import type { CartItem } from "@/stores/cartStore"

export interface CartTotals {
  subtotal: number
  shipping: number
  tax: number
  total: number
}

export interface CartItemCardProps {
  item: CartItem
  onQuantityChange: (userProductId: string, currentQuantity: number, delta: number) => void
  onRemoveItem: (userProductId: string) => void
}
