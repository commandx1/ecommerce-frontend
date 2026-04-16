import type { CartItem } from "@/stores/cartStore"

export interface CartItemAlerts {
  productAlert: string | null
  stockAlert: string | null
  userProductAlert: string | null
}

export const normalizeCartAlert = (value: string | null | undefined): string | null => {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const getCartItemAlerts = (item: CartItem): CartItemAlerts => {
  return {
    productAlert: normalizeCartAlert(item.product.productAlert),
    stockAlert: normalizeCartAlert(item.userProduct.stockAlert),
    userProductAlert: normalizeCartAlert(item.userProduct.userProductAlert),
  }
}

export const hasBlockingCartAlert = (item: CartItem): boolean => {
  const alerts = getCartItemAlerts(item)
  return Boolean(alerts.productAlert || alerts.stockAlert || alerts.userProductAlert)
}

export const getBlockingCartItems = (items: CartItem[]): CartItem[] => {
  return items.filter(hasBlockingCartAlert)
}
