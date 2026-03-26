"use client"

import { useMemo } from "react"
import { useCartStore } from "@/stores/cartStore"
import { useCheckoutStore } from "@/stores/checkoutStore"

interface UseOrderSummaryResult {
  currentStep: number
  selectedShippingEtaText: string
  shippingAddress: ReturnType<typeof useCheckoutStore.getState>["shippingAddress"]
  items: ReturnType<typeof useCartStore.getState>["items"]
  subtotal: number
  shipping: number
  total: number
  volumeDiscount: number
}

export function useOrderSummary(): UseOrderSummaryResult {
  const { items } = useCartStore()
  const { shippingAddress, currentStep, selectedShippingEtaText, selectedShippingCost } = useCheckoutStore()

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.userProduct.price * item.quantity, 0)
  }, [items])

  const volumeDiscount = subtotal > 2000 ? subtotal * 0.05 : 0
  const shipping = selectedShippingCost
  const total = subtotal - volumeDiscount + shipping

  return {
    currentStep,
    selectedShippingEtaText,
    shippingAddress,
    items,
    subtotal,
    shipping,
    total,
    volumeDiscount,
  }
}
