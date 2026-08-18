"use client"

import { useMemo } from "react"
import type { SavedCard } from "@/lib/api/orders"
import { AUTO_ORDER_PERIOD_LABELS, type AutoOrderPeriod } from "@/lib/constants/auto-order"
import { useCartStore } from "@/stores/cartStore"

export interface AutoOrderLine {
  userProductId: string
  productName: string
  quantity: number
  period: AutoOrderPeriod
  periodLabel: string
}

export interface CheckoutAutoOrderState {
  hasAutoOrderItems: boolean
  autoOrderLines: AutoOrderLine[]
}

/**
 * The recurring lines the buyer picked in the cart. Checkout only reads them —
 * the schedule itself lives on the cart item, server side.
 */
export function useCheckoutAutoOrder(): CheckoutAutoOrderState {
  const items = useCartStore((state) => state.items)

  const autoOrderLines = useMemo<AutoOrderLine[]>(() => {
    return items
      .filter((item): item is typeof item & { autoOrder: AutoOrderPeriod } => item.autoOrder !== null)
      .map((item) => ({
        userProductId: item.userProduct.userProductId,
        productName: item.product.name,
        quantity: item.quantity,
        period: item.autoOrder,
        periodLabel: AUTO_ORDER_PERIOD_LABELS[item.autoOrder],
      }))
  }, [items])

  return {
    hasAutoOrderItems: autoOrderLines.length > 0,
    autoOrderLines,
  }
}

/**
 * A saved card that already carries an off-session mandate needs no extra
 * consent; one that does not can only cover auto orders when the buyer
 * explicitly allows future automatic charges (`openToAutoOrder`).
 */
export function savedCardNeedsAutoOrderConsent(card: SavedCard | undefined): boolean {
  if (!card) return false
  return !card.openToAutoPayment
}
